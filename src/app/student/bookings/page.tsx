'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { RazorpayPayment } from '@/components/RazorpayPayment';
import { RatingModal } from '@/components/RatingModal';
import { BookingService } from '@/lib/services/booking.service';
import { RatingService } from '@/lib/services/rating.service';
import { ChatService } from '@/lib/services/chat.service';
import { Booking } from '@/lib/types/database';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { BackHeader } from '@/components/BackHeader';

export default function StudentBookingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<(Booking & { id: string, tutorPhoneNumber?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);

    // Rating modal state
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<(Booking & { id: string }) | null>(null);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const unsubscribe = BookingService.listenToStudentBookings(user.uid, (bookingsData) => {
                console.log('Real-time student bookings update:', bookingsData.length);
                setBookings(bookingsData);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);



    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await BookingService.cancelBooking(bookingId, 'Cancelled by student');
            // loadBookings(); // Auto-updated by listener
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            alert('Failed to cancel booking');
        }
    };

    const handleRegenerateCode = async (bookingId: string) => {
        if (!confirm('Generate a new completion code? The old code will no longer work.')) return;

        setRegeneratingCode(bookingId);
        try {
            const newCode = await BookingService.regenerateCompletionCode(bookingId);
            alert(`New completion code: ${newCode}`);
            // loadBookings(); // Auto-updated by listener
        } catch (error) {
            console.error('Failed to regenerate code:', error);
            alert('Failed to regenerate code');
        } finally {
            setRegeneratingCode(null);
        }
    };

    const handlePayInCash = async (bookingId: string) => {
        if (!confirm('Confirm payment in cash? This will mark the bill as paid.')) return;

        try {
            await BookingService.markFinalBillPaidInCash(bookingId);
            alert('Payment marked as completed!');
            // loadBookings(); // Auto-updated by listener
        } catch (error) {
            console.error('Failed to mark payment as completed:', error);
            alert('Failed to update payment status');
        }
    };

    const handleOpenRatingModal = (booking: Booking & { id: string }) => {
        setSelectedBooking(booking);
        setRatingModalOpen(true);
    };

    const handleSubmitRating = async (rating: number, comment: string) => {
        if (!user || !selectedBooking) return;

        try {
            await RatingService.submitRating(
                user.uid,
                selectedBooking.tutorId,
                rating,
                comment,
                selectedBooking.id
            );

            // Mark booking as rated
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase/config');
            await updateDoc(doc(db, 'bookings', selectedBooking.id), {
                rated: true,
                updatedAt: serverTimestamp(),
            });

            alert('Thank you for your rating!');
            // loadBookings(); // Auto-updated by listener
        } catch (error: any) {
            console.error('Failed to submit rating:', error);
            alert(error.message || 'Failed to submit rating');
        }
    };

    const handleMessageProvider = async (tutorId: string, bookingId: string) => {
        if (!user) return;

        try {
            // Check if chat exists first
            const existingChatId = await ChatService.findChat(user.uid, tutorId, bookingId);

            if (existingChatId) {
                router.push(`/student/messages/detail?chatId=${existingChatId}`);
            } else {
                // Redirect with metadata to start a new chat LATER (on first message)
                router.push(`/student/messages/detail?tutorId=${tutorId}&bookingId=${bookingId}`);
            }
        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Failed to open chat');
        }
    };

    const handleCallProvider = (phoneNumber: string) => {
        window.location.href = `tel:${phoneNumber}`;
    };

    const filteredBookings = bookings.filter((booking) => {
        if (filter === 'all') return true;
        return booking.status === filter;
    }).sort((a, b) => {
        // Helper to get timestamp from booking
        const getTime = (booking: Booking) => {
            const date = booking.date.toDate();
            const [hours, minutes] = booking.startTime.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
            return date.getTime();
        };

        const timeA = getTime(a);
        const timeB = getTime(b);

        // Sort order depends on filter
        // For 'all', 'completed', 'cancelled': Descending (Most recent first)
        // For 'pending', 'confirmed', 'in_progress': Ascending (Soonest first)
        if (['all', 'completed', 'cancelled'].includes(filter)) {
            return timeB - timeA;
        } else {
            return timeA - timeB;
        }
    });

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in to view your bookings</p>
            </div>
        );
    }

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' },
    ];



    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Header - Teal Background */}
            <div className="bg-[#005461] px-4 py-6 shadow-sm">
                <h1 className="text-2xl font-bold text-white">My Bookings</h1>
                <p className="text-white/80 text-sm mt-1">Manage your service requests</p>
            </div>

            <div className="w-full">
                {/* Filter Tabs - Pill Style */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 mb-4">
                    <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter === f.id
                                    ? 'bg-[#005461] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                                    }`}
                            >
                                {f.label}
                                <span className={`ml-2 text-xs ${filter === f.id ? 'text-white/80' : 'text-gray-500'}`}>
                                    {f.id === 'all' ? bookings.length : bookings.filter(b => b.status === f.id).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-3 border-[#005461] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground text-sm animate-pulse">Loading your bookings...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                            {filter === 'all'
                                ? "You haven't made any bookings yet."
                                : `You don't have any ${filter.replace('_', ' ')} bookings.`}
                        </p>
                        <Link href="/search" className="w-full max-w-xs px-4">
                            <Button className="w-full rounded-xl h-12 text-base bg-[#005461] hover:bg-[#003d47]">
                                Find a Service Provider
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-3 pb-8">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                onClick={() => router.push(`/student/booking-details?id=${booking.id}`)}
                                className="bg-white p-4 shadow-sm border-b border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                                            {booking.tutorName || 'Service Provider'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>{booking.subject || 'General Service'}</span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            booking.status === 'confirmed' ? 'default' :
                                                booking.status === 'pending' ? 'outline' :
                                                    booking.status === 'completed' ? 'secondary' :
                                                        'outline'
                                        }
                                        className={`capitalize px-3 py-1 rounded-full text-xs font-medium border-0 ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {booking.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#f0f9fa] flex flex-col items-center justify-center text-[#005461]">
                                        <span className="text-[10px] uppercase font-bold">
                                            {format(booking.date.toDate(), 'MMM')}
                                        </span>
                                        <span className="text-xl font-bold leading-none">
                                            {format(booking.date.toDate(), 'dd')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {format(booking.date.toDate(), 'EEEE')}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {booking.startTime}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Cards (Codes) */}
                                {booking.status === 'confirmed' && booking.startCode && (
                                    <div className="mb-4 p-4 rounded-xl bg-[#f0fdf4] border border-green-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-green-800">Start Code</span>
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        </div>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-3xl font-mono font-bold text-green-700 tracking-widest">
                                                {booking.startCode}
                                            </span>
                                            <span className="text-xs text-green-600 leading-tight">
                                                Share with provider<br />upon arrival
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {booking.status === 'in_progress' && booking.completionCode && (
                                    <div className="mb-4 p-4 rounded-xl bg-[#eff6ff] border border-blue-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Completion Code</span>
                                            {booking.codeExpiresAt && (
                                                <span className="text-[10px] text-blue-600 bg-white/50 px-2 py-0.5 rounded-full">
                                                    Expires {format(booking.codeExpiresAt.toDate(), 'h:mm a')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-3xl font-mono font-bold text-blue-700 tracking-widest mb-2">
                                            {booking.completionCode}
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-xs text-blue-600">
                                                Share after work is done
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRegenerateCode(booking.id);
                                                }}
                                                disabled={regeneratingCode === booking.id}
                                                className="text-xs font-medium text-blue-700 hover:text-blue-800 underline disabled:opacity-50"
                                            >
                                                {regeneratingCode === booking.id ? 'Generating...' : 'Regenerate'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Bill & Payment */}
                                {booking.status === 'completed' && booking.finalBillAmount && (
                                    <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-medium text-gray-700">Total Bill</span>
                                            <span className="text-xl font-bold text-gray-900">₹{booking.finalBillAmount}</span>
                                        </div>

                                        {booking.finalPaymentStatus === 'pending' ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded-lg">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    Payment Pending
                                                </div>
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePayInCash(booking.id);
                                                    }}
                                                >
                                                    Pay in Cash
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Paid via {booking.paymentMethod === 'cash' ? 'Cash' : 'Online'} on {booking.paidAt ? format(booking.paidAt.toDate(), 'MMM dd') : 'Unknown date'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                                    {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-10 rounded-xl text-sm border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMessageProvider(booking.tutorId, booking.id);
                                                }}
                                            >
                                                <span className="mr-2">💬</span> Message
                                            </Button>
                                            {booking.tutorPhoneNumber && (
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 h-10 rounded-xl text-sm border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCallProvider(booking.tutorPhoneNumber!);
                                                    }}
                                                >
                                                    <span className="mr-2">📞</span> Call
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {booking.status === 'completed' && !booking.rated && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-10 rounded-xl text-sm border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenRatingModal(booking);
                                            }}
                                        >
                                            <span className="mr-2">⭐</span> Rate Service
                                        </Button>
                                    )}

                                    {booking.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-10 rounded-xl text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelBooking(booking.id);
                                            }}
                                        >
                                            Cancel Request
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rating Modal */}
                <RatingModal
                    isOpen={ratingModalOpen}
                    onClose={() => {
                        setRatingModalOpen(false);
                        setSelectedBooking(null);
                    }}
                    onSubmit={handleSubmitRating}
                    tutorName={selectedBooking?.tutorName || 'Service Provider'}
                />
            </div>
        </div>
    );
}
