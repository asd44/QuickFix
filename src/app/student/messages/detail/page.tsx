'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatService } from '@/lib/services/chat.service';
import { UserService } from '@/lib/services/user.service';
import { Message, User, Booking, Chat } from '@/lib/types/database';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';

function StudentChatContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // ID from URL (might be null if new chat)
    const [chatId, setChatId] = useState<string | null>(searchParams.get('chatId'));
    const bookingIdFromUrl = searchParams.get('bookingId');
    const tutorIdFromUrl = searchParams.get('tutorId');

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingStatus, setBookingStatus] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Initial check: if no chatId but we have tutorId/bookingId, we are in "Draft" mode
    // If we have chatId, we load everything as normal.

    // Poll for booking status
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchBookingStatus = async (bookingId: string) => {
            try {
                const booking = await FirestoreREST.getDoc<Booking>('bookings', bookingId);
                if (booking) {
                    setBookingStatus(booking.status);
                }
            } catch (error) {
                console.error("Error fetching booking status", error);
            }
        };

        const initBookingPolling = async () => {
            let targetBookingId = bookingIdFromUrl;

            if (chatId && !targetBookingId) {
                const chat = await FirestoreREST.getDoc<Chat>('chats', chatId);
                targetBookingId = (chat as any)?.bookingId;
            }

            if (targetBookingId) {
                fetchBookingStatus(targetBookingId);
                intervalId = setInterval(() => fetchBookingStatus(targetBookingId!), 5000);
            }
        };

        initBookingPolling();
        return () => clearInterval(intervalId);
    }, [chatId, bookingIdFromUrl]);

    useEffect(() => {
        if (!user) return;

        if (chatId) {
            // Existing Chat: Listen to messages
            const unsubscribe = ChatService.listenToMessages(chatId, (msgs) => {
                setMessages(msgs);
                setLoading(false);
                setTimeout(scrollToBottom, 100);

                // Mark as read
                if (user?.uid) {
                    ChatService.markMessagesAsRead(chatId, user.uid);
                }
            });
            return () => unsubscribe();
        } else {
            // New Chat: No messages yet
            setMessages([]);
            setLoading(false);
        }
    }, [chatId, user]);

    // Fetch user details
    useEffect(() => {
        if (!user) return;

        const loadOtherUser = async () => {
            let targetUserId = tutorIdFromUrl;

            // If we have a chatId, we might need to find the other user ID from the chat doc
            // But usually we can get it from participants.
            // For simplicity, if we have chatId, we used to use listenToUserChats to find it.
            // If new chat, we rely on tutorIdFromUrl.

            if (chatId && !targetUserId) {
                // Fallback: Find user from chat participants
                // We'll use the existing method which is robust
                const unsubscribe = ChatService.listenToUserChats(user.uid, async (chats) => {
                    const currentChat = chats.find(c => c.id === chatId);
                    if (currentChat) {
                        const otherId = currentChat.participants.find(id => id !== user.uid);
                        if (otherId) {
                            const u = await UserService.getUserById(otherId);
                            setOtherUser(u);
                        }
                    }
                });
                return () => unsubscribe();
            } else if (targetUserId) {
                // Direct fetch
                const u = await UserService.getUserById(targetUserId);
                setOtherUser(u);
            }
        };

        loadOtherUser();
    }, [chatId, tutorIdFromUrl, user]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user) return; // Strict check

        // Strict check: Block sending if booking is completed/cancelled
        if (bookingStatus && !['confirmed', 'in_progress'].includes(bookingStatus)) {
            alert('Messaging is closed for this service request.');
            return;
        }

        try {
            let activeChatId = chatId;

            if (!activeChatId) {
                // Create Chat FIRST on first message
                if (!tutorIdFromUrl || !bookingIdFromUrl) {
                    console.error("Missing params to create chat");
                    return;
                }
                setIsCreating(true);
                activeChatId = await ChatService.createChat(user.uid, tutorIdFromUrl, bookingIdFromUrl);
                setChatId(activeChatId);

                // Update URL without reload
                const newUrl = `/student/messages/detail?chatId=${activeChatId}`;
                window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
                setIsCreating(false);
            }

            if (activeChatId) {
                await ChatService.sendMessage(activeChatId, user.uid, newMessage.trim());
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setIsCreating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // If invalid state (no chat ID AND no tutor ID), show error
    if (!chatId && !tutorIdFromUrl) {
        return <div className="p-4 text-center">Invalid Chat Configuration</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-64px)] bg-gray-50">
            {/* Header - Student Theme */}
            <div className="bg-white text-gray-900 p-4 shadow-sm border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        {otherUser?.tutorProfile?.firstName?.[0] || 'T'}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">
                            {otherUser?.tutorProfile?.firstName || 'Provider'} {otherUser?.tutorProfile?.lastName || ''}
                        </h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            {otherUser?.tutorProfile?.category ? (
                                <>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    {otherUser.tutorProfile.category}
                                </>
                            ) : 'Service Provider'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${msg.senderId === user?.uid
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                    }`}
                            >
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.senderId === user?.uid ? 'text-white/70' : 'text-gray-400'
                                    }`}>
                                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {!loading && messages.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area or Status Message */}
            {(!bookingStatus || ['confirmed', 'in_progress'].includes(bookingStatus)) ? (
                <div className="bg-white p-4 border-t border-gray-100 pb-8">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            disabled={(!!bookingStatus && !['confirmed', 'in_progress'].includes(bookingStatus)) || isCreating}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || (!!bookingStatus && !['confirmed', 'in_progress'].includes(bookingStatus)) || isCreating}
                            className="bg-primary text-white p-3 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center pb-8">
                    <p className="text-gray-500 text-sm">
                        {bookingStatus === 'completed'
                            ? 'This service request is completed. Messaging is closed.'
                            : 'Messaging is available only during active jobs.'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function StudentChatPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading chat...</div>}>
            <StudentChatContent />
        </Suspense>
    );
}
