import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    updateDoc,
    serverTimestamp,
    increment,
    Timestamp,
    Unsubscribe,
    getDocs,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Chat, Message } from '@/lib/types/database';

export class ChatService {
    // Get or create chat between student and tutor
    // Find existing chat without creating
    static async findChat(studentId: string, tutorId: string, bookingId?: string): Promise<string | null> {
        let q;

        if (bookingId) {
            q = query(
                collection(db, 'chats'),
                where('bookingId', '==', bookingId)
            );
        } else {
            q = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', studentId)
            );
        }

        const querySnapshot = await getDocs(q);

        const existingChat = querySnapshot.docs.find(doc => {
            const data = doc.data();
            const correctParticipants = data.participants.includes(tutorId) && data.participants.includes(studentId);
            if (!bookingId) {
                return correctParticipants && !data.bookingId;
            }
            return correctParticipants;
        });

        return existingChat ? existingChat.id : null;
    }

    // Create a new chat
    static async createChat(studentId: string, tutorId: string, bookingId?: string): Promise<string> {
        const chatData: any = {
            participants: [studentId, tutorId],
            lastMessage: '',
            lastMessageTime: serverTimestamp() as Timestamp,
            unreadCount: {
                [studentId]: 0,
                [tutorId]: 0,
            },
        };

        if (bookingId) {
            chatData.bookingId = bookingId;
        }

        const chatRef = await addDoc(collection(db, 'chats'), chatData);
        return chatRef.id;
    }

    // Get or create chat (Legacy wrapper)
    static async getOrCreateChat(studentId: string, tutorId: string, bookingId?: string): Promise<string> {
        const existingId = await this.findChat(studentId, tutorId, bookingId);
        if (existingId) return existingId;
        return this.createChat(studentId, tutorId, bookingId);
    }

    // Get user's chats (real-time listener)
    static listenToUserChats(userId: string, callback: (chats: (Chat & { id: string })[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Chat & { id: string }));
            callback(chats);
        });
    }

    // Get messages for a chat (real-time listener)
    static listenToMessages(chatId: string, callback: (messages: (Message & { id: string })[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Message & { id: string }));
            callback(messages);
        });
    }

    // Send a message
    static async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
        const messageData: Omit<Message, 'id'> = {
            senderId,
            text,
            timestamp: serverTimestamp() as Timestamp,
            read: false,
        };

        // Add message to subcollection
        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

        // Update chat's last message and unread count
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        const chatData = chatDoc.data() as Chat;
        const otherUserId = chatData.participants.find(id => id !== senderId);

        await updateDoc(chatRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            [`unreadCount.${otherUserId}`]: increment(1),
        });

        // Show browser notification if other user has them enabled
        // Send notification unconditionally (Service handles platform checks)
        try {
            if (otherUserId) {
                const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
                if (otherUserDoc.exists()) {
                    const otherUser = otherUserDoc.data();
                    if (otherUser.notificationSettings?.enabled !== false) { // Default to true if undefined
                        // Get sender's name
                        const senderDoc = await getDoc(doc(db, 'users', senderId));
                        const senderName = senderDoc.exists()
                            ? `${senderDoc.data().studentProfile?.firstName || senderDoc.data().tutorProfile?.firstName || 'Someone'}`
                            : 'Someone';

                        const { NotificationService } = await import('./notification.service');
                        await NotificationService.sendNotification(
                            otherUserId,
                            `New message from ${senderName}`,
                            text.substring(0, 100),
                            { clickAction: '/messages', chatId: chatId }
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Mark messages as read
    static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            [`unreadCount.${userId}`]: 0,
        });

        // Mark all messages as read
        const messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            where('read', '==', false),
            where('senderId', '!=', userId)
        );

        const snapshot = await getDocs(messagesQuery);
        const updatePromises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
        );

        await Promise.all(updatePromises);
    }
}
