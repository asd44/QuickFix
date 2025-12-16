'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { ChatService } from '@/lib/services/chat.service';
import { UserService } from '@/lib/services/user.service';
import { Chat, Message, User } from '@/lib/types/database';

import { Badge } from '@/components/Badge';

export default function TutorMessagesPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<(Chat & { otherUser?: User })[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && userData?.role === 'tutor') {
            loadChats();
        }
    }, [user, userData]);

    useEffect(() => {
        if (selectedChat) {
            const unsubscribe = ChatService.listenToMessages(selectedChat, (msgs) => {
                setMessages(msgs);
                scrollToBottom();
            });
            return () => unsubscribe();
        }
    }, [selectedChat]);

    const loadChats = async () => {
        setLoading(true);
        try {
            const unsubscribe = ChatService.listenToUserChats(user!.uid, async (chatList: Chat[]) => {
                // Load other user details for each chat
                const chatsWithUsers = await Promise.all(
                    chatList.map(async (chat: Chat) => {
                        const otherUserId = chat.participants.find((id: string) => id !== user!.uid);
                        if (otherUserId) {
                            const otherUser = await UserService.getUserById(otherUserId);
                            return { ...chat, otherUser: otherUser || undefined };
                        }
                        return chat;
                    })
                );
                setChats(chatsWithUsers);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Failed to load chats:', error);
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!selectedChat || !newMessage.trim()) return;

        try {
            await ChatService.sendMessage(selectedChat, user!.uid, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!user || userData?.role !== 'tutor') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a service provider to access messages</p>
            </div>
        );
    }

    const selectedChatData = chats.find(c => c.id === selectedChat);

    return (
        <div className="min-h-screen bg-gray-50 w-full pb-20">
            {/* Provider Header Style */}
            <div className="bg-[#5A0E24] text-white px-6 py-6 shadow-md mb-6">
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-white/80 text-sm mt-1">Manage your customer conversations</p>
            </div>

            <div className="w-full px-4 md:px-6">
                {/* Chat List */}
                <div className="w-full">
                    <div className="w-full bg-white rounded-lg">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-[#5A0E24]">Conversations</h2>
                        </div>
                        <div className="pt-0">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-[#5A0E24] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    </div>
                                    <p className="font-medium text-gray-900">No conversations yet</p>
                                    <p className="text-sm mt-1">Customers will message you after viewing your profile</p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => router.push(`/tutor/messages/detail?chatId=${chat.id}`)}
                                            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {chat.otherUser?.studentProfile?.firstName || 'Customer'}{' '}
                                                    {chat.otherUser?.studentProfile?.lastName || ''}
                                                </h3>
                                                {chat.unreadCount?.[user.uid] > 0 && (
                                                    <Badge className="bg-[#5A0E24] hover:bg-[#450a1b] ml-2">
                                                        {chat.unreadCount[user.uid]}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 truncate mb-2 font-medium">
                                                {chat.lastMessage || 'No messages yet'}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                                <span>{chat.otherUser?.studentProfile?.city || 'Unknown Location'}</span>
                                                <span>{chat.lastMessageTime?.toDate().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
