'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
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
                            return {
                                ...chat,
                                otherUserName: otherUser.tutorProfile
                                    ? `${otherUser.tutorProfile.firstName} ${otherUser.tutorProfile.lastName}`
                                    : otherUser.studentProfile
                                        ? `${otherUser.studentProfile.firstName} ${otherUser.studentProfile.lastName}`
                                        : 'Unknown User',
                                otherUserLocation: otherUser.tutorProfile
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
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <h2 className="text-xl font-bold">Conversations</h2>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-center text-muted-foreground py-8">Loading...</p>
                        ) : chats.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No conversations yet
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => setSelectedChatId(chat.id)}
                                        className={`p-4 rounded-md cursor-pointer transition-colors ${selectedChatId === chat.id
                                            ? 'bg-primary/10 border-l-4 border-primary'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold">{chat.otherUserName || 'Unknown'}</span>
                                            {chat.unreadCount && chat.unreadCount[user.uid] > 0 && (
                                                <Badge variant="default" className="ml-2">
                                                    {chat.unreadCount[user.uid]}
                                                </Badge>
                                            )}
                                        </div>
                                        {chat.otherUserLocation && (
                                            <p className="text-xs text-muted-foreground mb-1">
                                                📍 {chat.otherUserLocation}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground truncate">
                                            {chat.lastMessage || 'No messages yet'}
                                        </p>
                                        {chat.lastMessageTime && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(chat.lastMessageTime.toDate(), 'MMM dd, h:mm a')}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-6 flex flex-col h-full">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="pb-4 border-b mb-4">
                                    <h3 className="font-bold text-lg">{selectedChat.otherUserName}</h3>
                                    {selectedChat.otherUserLocation && (
                                        <p className="text-sm text-muted-foreground">
                                            📍 {selectedChat.otherUserLocation}
                                        </p>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.senderId === user.uid
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.text}</p>
                                                {msg.timestamp && (
                                                    <p className={`text-xs mt-1 ${msg.senderId === user.uid
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-muted-foreground'
                                                        }`}>
                                                        {format(msg.timestamp.toDate(), 'h:mm a')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Message Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 p-3 rounded-md border border-input bg-background"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                                        Send
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Select a conversation to start messaging
                            </div>
                        )}
                    </CardContent>
                </Card>
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
