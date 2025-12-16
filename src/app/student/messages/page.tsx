'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ChatService } from '@/lib/services/chat.service';
import { UserService } from '@/lib/services/user.service';
import { Chat, Message } from '@/lib/types/database';
import { format } from 'date-fns';

interface ChatWithDetails extends Chat {
    id: string;
    otherUserName?: string;
    otherUserLocation?: string;
}

function MessagesPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const chatIdFromUrl = searchParams.get('chatId');

    const [chats, setChats] = useState<ChatWithDetails[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(chatIdFromUrl);
    const [messages, setMessages] = useState<(Message & { id: string })[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);

    // Load user's chats
    useEffect(() => {
        if (!user) return;

        const unsubscribe = ChatService.listenToUserChats(user.uid, async (chatList) => {
            // Get other user details for each chat
            const chatsWithDetails = await Promise.all(
                chatList.map(async (chat) => {
                    const otherUserId = chat.participants.find(id => id !== user.uid);
                    if (otherUserId) {
                        try {
                            const otherUser = await UserService.getUserById(otherUserId);
                            if (!otherUser) return chat; // Handle null user

                            return {
                                ...chat,
                                otherUserName: otherUser?.tutorProfile
                                    ? `${otherUser.tutorProfile.firstName} ${otherUser.tutorProfile.lastName}`
                                    : otherUser?.studentProfile
                                        ? `${otherUser.studentProfile.firstName} ${otherUser.studentProfile.lastName}`
                                        : 'Unknown User',
                                otherUserLocation: otherUser?.tutorProfile
                                    ? `${otherUser.tutorProfile.city}, ${otherUser.tutorProfile.area}`
                                    : undefined,
                            };
                        } catch (error) {
                            console.error('Error fetching other user:', error);
                            return chat;
                        }
                    }
                    return chat;
                })
            );

            setChats(chatsWithDetails);
            setLoading(false);

            // Auto-select chat from URL if provided
            if (chatIdFromUrl && !selectedChatId) {
                setSelectedChatId(chatIdFromUrl);
            }
        });

        return () => unsubscribe();
    }, [user, chatIdFromUrl, selectedChatId]);

    // Load messages for selected chat
    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }

        const unsubscribe = ChatService.listenToMessages(selectedChatId, (messageList) => {
            setMessages(messageList);
        });

        // Mark messages as read
        if (user) {
            ChatService.markMessagesAsRead(selectedChatId, user.uid);
        }

        return () => unsubscribe();
    }, [selectedChatId, user]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedChatId || !user) return;

        try {
            await ChatService.sendMessage(selectedChatId, user.uid, messageText);
            setMessageText('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p>Please log in to view messages</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header - Teal Background matched with My Bookings */}
            <div className="bg-[#005461] px-4 py-6 shadow-sm">
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-white/80 text-sm mt-1">Manage your conversations</p>
            </div>

            {/* Content */}
            <div className="container mx-auto px-0">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : chats.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No messages yet</h3>
                        <p className="text-muted-foreground mt-1">Start a conversation with a service provider!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => router.push(`/student/messages/detail?chatId=${chat.id}`)}
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                        {chat.otherUserName?.[0] || '?'}
                                    </div>
                                    {/* Online Indicator (Optional - could be added if data exists) */}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate pr-2">
                                            {chat.otherUserName || 'Unknown User'}
                                        </h3>
                                        {chat.lastMessageTime && (
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {format(chat.lastMessageTime.toDate(), 'h:mm a')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate pr-2 ${chat.unreadCount?.[user.uid] > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {chat.lastMessage || 'No messages yet'}
                                        </p>
                                        {chat.unreadCount && chat.unreadCount[user.uid] > 0 && (
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold shrink-0">
                                                {chat.unreadCount[user.uid]}
                                            </span>
                                        )}
                                    </div>
                                    {chat.otherUserLocation && (
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <span className="text-[10px]">📍</span> {chat.otherUserLocation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function StudentMessagesPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-[50vh]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        }>
            <MessagesPageContent />
        </Suspense>
    );
}
