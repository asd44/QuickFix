import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { Chat, Message } from '@/lib/types/database';

export class ChatService {
    // Find existing chat without creating
    static async findChat(studentId: string, tutorId: string, bookingId?: string): Promise<string | null> {
        let chats: Chat[];

        if (bookingId) {
            chats = await FirestoreREST.query<Chat>('chats', {
                where: [{ field: 'bookingId', op: 'EQUAL', value: bookingId }]
            });
        } else {
            chats = await FirestoreREST.query<Chat>('chats', {
                where: [{ field: 'participants', op: 'ARRAY_CONTAINS', value: studentId }]
            });
        }

        const existingChat = chats.find(chat => {
            const correctParticipants = chat.participants.includes(tutorId) && chat.participants.includes(studentId);
            if (!bookingId) {
                return correctParticipants && !(chat as any).bookingId;
            }
            return correctParticipants;
        });

        return existingChat ? (existingChat as any).id : null;
    }

    // Create a new chat
    static async createChat(studentId: string, tutorId: string, bookingId?: string): Promise<string> {
        const chatData: any = {
            participants: [studentId, tutorId],
            lastMessage: '',
            lastMessageTime: FirestoreREST.serverTimestamp(),
            unreadCount: {
                [studentId]: 0,
                [tutorId]: 0,
            },
        };

        if (bookingId) {
            chatData.bookingId = bookingId;
        }

        const chatId = await FirestoreREST.addDoc('chats', chatData);
        return chatId || '';
    }

    // Get or create chat
    static async getOrCreateChat(studentId: string, tutorId: string, bookingId?: string): Promise<string> {
        const existingId = await this.findChat(studentId, tutorId, bookingId);
        if (existingId) return existingId;
        return this.createChat(studentId, tutorId, bookingId);
    }

    // Get user's chats
    static async getUserChats(userId: string): Promise<(Chat & { id: string })[]> {
        return FirestoreREST.query<Chat & { id: string }>('chats', {
            where: [{ field: 'participants', op: 'ARRAY_CONTAINS', value: userId }],
            orderBy: [{ field: 'lastMessageTime', direction: 'DESCENDING' }]
        });
    }

    // Get messages for a chat (subcollection - needs special handling)
    static async getMessages(chatId: string): Promise<(Message & { id: string })[]> {
        // Note: REST API subcollection path
        return FirestoreREST.query<Message & { id: string }>(`chats/${chatId}/messages`, {
            orderBy: [{ field: 'timestamp', direction: 'ASCENDING' }]
        });
    }

    // Send a message
    static async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
        const messageData = {
            senderId,
            text,
            timestamp: FirestoreREST.serverTimestamp(),
            read: false,
        };

        // Add message to subcollection
        await FirestoreREST.addDoc(`chats/${chatId}/messages`, messageData);

        // Get chat to find other user
        const chat = await FirestoreREST.getDoc<Chat>('chats', chatId);
        if (!chat) return;

        const otherUserId = chat.participants.find(id => id !== senderId);

        // Update chat's last message
        await FirestoreREST.updateDoc('chats', chatId, {
            lastMessage: text,
            lastMessageTime: FirestoreREST.serverTimestamp(),
        });

        // Note: Increment unread count manually
        if (otherUserId && chat.unreadCount) {
            const currentCount = chat.unreadCount[otherUserId] || 0;
            await FirestoreREST.updateDoc('chats', chatId, {
                [`unreadCount.${otherUserId}`]: currentCount + 1,
            });
        }

        // Send notification
        try {
            if (otherUserId) {
                const otherUser = await FirestoreREST.getDoc<any>('users', otherUserId);
                if (otherUser?.notificationSettings?.enabled !== false) {
                    const sender = await FirestoreREST.getDoc<any>('users', senderId);
                    const senderName = sender?.studentProfile?.firstName || sender?.tutorProfile?.firstName || 'Someone';

                    const { NotificationService } = await import('./notification.service');
                    await NotificationService.sendNotification(
                        otherUserId,
                        `New message from ${senderName}`,
                        text.substring(0, 100),
                        { clickAction: '/messages', chatId: chatId }
                    );
                }
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Mark messages as read
    static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
        await FirestoreREST.updateDoc('chats', chatId, {
            [`unreadCount.${userId}`]: 0,
        });

        // Get unread messages and mark them as read
        const messages = await FirestoreREST.query<Message & { id: string }>(`chats/${chatId}/messages`, {
            where: [
                { field: 'read', op: 'EQUAL', value: false }
            ]
        });

        // Filter messages not from current user and update them
        await Promise.all(
            messages
                .filter(msg => msg.senderId !== userId)
                .map(msg => FirestoreREST.updateDoc(`chats/${chatId}/messages`, msg.id, { read: true }))
        );
    }

    // Polling-based listeners
    static listenToUserChats(userId: string, callback: (chats: (Chat & { id: string })[]) => void): () => void {
        this.getUserChats(userId).then(callback);
        const interval = setInterval(() => {
            this.getUserChats(userId).then(callback);
        }, 3000);
        return () => clearInterval(interval);
    }

    static listenToMessages(chatId: string, callback: (messages: (Message & { id: string })[]) => void): () => void {
        this.getMessages(chatId).then(callback);
        const interval = setInterval(() => {
            this.getMessages(chatId).then(callback);
        }, 2000); // Faster polling for messages
        return () => clearInterval(interval);
    }
}
