'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { ChatService } from '@/lib/services/chat.service';
import { UserService } from '@/lib/services/user.service';
import { Chat, Message, User } from '@/lib/types/database';

export default function TutorMessagesPage() {
    const { user, userData } = useAuth();
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Messages</h1>

            <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Chat List */}
                <div className="lg:col-span-1 overflow-y-auto">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Conversations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No conversations yet</p>
                                    <p className="text-xs mt-2">Customers will message you after viewing your profile</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => setSelectedChat(chat.id)}
                                            className={`p-4 rounded-md cursor-pointer transition-colors ${selectedChat === chat.id
                                                ? 'bg-primary/10 border border-primary'
                                                : 'bg-muted hover:bg-muted/80'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold">
                                                    {chat.otherUser?.studentProfile?.firstName || 'Customer'}{' '}
                                                    {chat.otherUser?.studentProfile?.lastName || ''}
                                                </h3>
                                                {chat.unreadCount?.[user.uid] > 0 && (
                                                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                                                        {chat.unreadCount[user.uid]}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {chat.lastMessage || 'No messages yet'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {chat.lastMessageTime?.toDate().toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Messages */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        {selectedChat ? (
                            <>
                                <CardHeader className="border-b">
                                    <CardTitle>
                                        {selectedChatData?.otherUser?.studentProfile?.firstName || 'Customer'}{' '}
                                        {selectedChatData?.otherUser?.studentProfile?.lastName || ''}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedChatData?.otherUser?.studentProfile?.grade} • {selectedChatData?.otherUser?.studentProfile?.city}
                                    </p>
                                </CardHeader>

                                <CardContent className="flex-1 overflow-y-auto p-4">
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${message.senderId === user.uid
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                        }`}
                                                >
                                                    <p className="text-sm">{message.text}</p>
                                                    <p className="text-xs opacity-70 mt-1">
                                                        {message.timestamp?.toDate().toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </CardContent>

                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 rounded-md border border-border bg-background"
                                        />
                                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <p className="text-lg font-semibold mb-2">No conversation selected</p>
                                    <p className="text-sm">Select a conversation from the list to start messaging</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
