'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingService } from '@/lib/services/booking.service';
import { ChatService } from '@/lib/services/chat.service';
import { RatingService } from '@/lib/services/rating.service';
import { Booking } from '@/lib/types/database';
import { format } from 'date-fns';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { RatingModal } from '@/components/RatingModal';

function BookingDetailsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');

    const [booking, setBooking] = useState<(Booking & { id: string, tutorPhoneNumber?: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [regeneratingCode, setRegeneratingCode] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);

    useEffect(() => {
        if (user && bookingId) {
            setLoading(true);
            const unsubscribe = BookingService.listenToBooking(bookingId, (updatedBooking) => {
                if (updatedBooking) {
                    setBooking(updatedBooking);
                } else {
                    alert('Booking not found');
                    router.back();
                }
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user, bookingId]);

    const handleCancelBooking = async () => {
        if (!booking || !confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await BookingService.cancelBooking(booking.id, 'Cancelled by student');
            // loadBookingDetails(); // Updated by listener
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            alert('Failed to cancel booking');
        }
    };

    const handleRegenerateCode = async () => {
        if (!booking || !confirm('Generate a new completion code? The old code will no longer work.')) return;

        setRegeneratingCode(true);
        try {
            const newCode = await BookingService.regenerateCompletionCode(booking.id);
            alert(`New completion code: ${newCode}`);
            // loadBookingDetails(); // Updated by listener
        } catch (error) {
            console.error('Failed to regenerate code:', error);
            alert('Failed to regenerate code');
        } finally {
            setRegeneratingCode(false);
        }
    };

    const handleMessageProvider = async () => {
        if (!user || !booking) return;

        try {
            // Check if chat exists first
            const existingChatId = await ChatService.findChat(user.uid, booking.tutorId, booking.id);

            if (existingChatId) {
                router.push(`/student/messages/detail?chatId=${existingChatId}`);
            } else {
                // Redirect with metadata to start a new chat LATER (on first message)
                router.push(`/student/messages/detail?tutorId=${booking.tutorId}&bookingId=${booking.id}`);
            }
        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Failed to open chat');
        }
    };

    const handleSubmitRating = async (rating: number, comment: string) => {
        if (!user || !booking) return;

        try {
            await RatingService.submitRating(
                user.uid,
                booking.tutorId,
                rating,
                comment,
                booking.id
            );

            // Mark booking as rated locally or re-fetch
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase/config');
            await updateDoc(doc(db, 'bookings', booking.id), {
                rated: true,
                updatedAt: serverTimestamp(),
            });

            alert('Thank you for your rating!');
            // loadBookingDetails(); // Updated by listener
        } catch (error: any) {
            console.error('Failed to submit rating:', error);
            alert(error.message || 'Failed to submit rating');
        }
    };

    const handleCashPayment = async () => {
        if (!booking || !confirm('Confirm that you are paying ₹' + booking.finalBillAmount + ' in cash?')) return;

        setLoading(true);
        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase/config');

            await updateDoc(doc(db, 'bookings', booking.id), {
                finalPaymentStatus: 'completed',
                paymentMethod: 'cash',
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            alert('Payment successful!');
            // loadBookingDetails(); // Updated by listener
        } catch (error) {
            console.error('Failed to update payment:', error);
            alert('Failed to update payment status');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#005461] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!booking) return null;

    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="Booking Details" className="py-4 px-0" />

            <div className="px-4 space-y-6">
                {/* Status Badge */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Status</span>
                    <Badge
                        variant={
                            booking.status === 'confirmed' ? 'default' :
                                booking.status === 'pending' ? 'outline' :
                                    booking.status === 'completed' ? 'secondary' :
                                        'outline'
                        }
                        className={`capitalize px-3 py-1 rounded-full text-sm font-medium border-0 ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {booking.status.replace('_', ' ')}
                    </Badge>
                </div>

                {/* Provider Details */}
                <div className="bg-gray-50 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Service Provider</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#005461] text-white flex items-center justify-center text-xl font-bold">
                            {booking.tutorName?.[0] || 'P'}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">{booking.tutorName || 'Service Provider'}</h2>
                            <p className="text-gray-600">{booking.subject || 'General Service'}</p>
                        </div>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f0f9fa] rounded-2xl p-5">
                        <span className="block text-xs font-bold text-[#005461] uppercase tracking-wider mb-1">Date</span>
                        <span className="block text-lg font-bold text-gray-900">{format(booking.date.toDate(), 'MMM dd, yyyy')}</span>
                        <span className="block text-sm text-gray-500">{format(booking.date.toDate(), 'EEEE')}</span>
                    </div>
                    <div className="bg-[#f0f9fa] rounded-2xl p-5">
                        <span className="block text-xs font-bold text-[#005461] uppercase tracking-wider mb-1">Time</span>
                        <span className="block text-lg font-bold text-gray-900">{booking.startTime}</span>
                        <span className="block text-sm text-gray-500">Scheduled</span>
                    </div>
                </div>

                {/* Action Codes */}
                {booking.status === 'confirmed' && booking.startCode && (
                    <div className="bg-[#f0fdf4] border border-green-100 rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-800">Start Code</span>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                        <div className="text-center py-2">
                            <span className="text-4xl font-mono font-bold text-green-700 tracking-widest">
                                {booking.startCode}
                            </span>
                        </div>
                        <p className="text-center text-xs text-green-600 mt-2">
                            Share this code with the provider when they arrive to start the service.
                        </p>
                    </div>
                )}

                {booking.status === 'in_progress' && booking.completionCode && (
                    <div className="bg-[#eff6ff] border border-blue-100 rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Completion Code</span>
                            {booking.codeExpiresAt && (
                                <span className="text-[10px] text-blue-600 bg-white/50 px-2 py-0.5 rounded-full">
                                    Expires {format(booking.codeExpiresAt.toDate(), 'h:mm a')}
                                </span>
                            )}
                        </div>
                        <div className="text-center py-2">
                            <span className="text-4xl font-mono font-bold text-blue-700 tracking-widest">
                                {booking.completionCode}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p className="text-center text-xs text-blue-600">
                                Share this code only after the work is completed satisfactorily.
                            </p>
                            <button
                                onClick={handleRegenerateCode}
                                disabled={regeneratingCode}
                                className="text-xs font-medium text-blue-700 hover:text-blue-800 underline disabled:opacity-50"
                            >
                                {regeneratingCode ? 'Generating...' : 'Regenerate Code'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Payment Section */}
                {booking.status === 'completed' && booking.finalBillAmount && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Payment Details</h3>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700">Total Bill Amount</span>
                            <span className="text-xl font-bold text-gray-900">₹{booking.finalBillAmount}</span>
                        </div>

                        {booking.finalPaymentStatus === 'pending' ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Payment Pending
                                </div>
                                <Button
                                    onClick={handleCashPayment}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full shadow-md transform transition-transform hover:scale-[1.02]"
                                >
                                    Pay in Cash
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Paid on {booking.paidAt ? format(booking.paidAt.toDate(), 'MMM dd, yyyy') : 'Unknown date'}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                    {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                        <>
                            {booking.tutorPhoneNumber && (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-900"
                                    onClick={() => window.location.href = `tel:${booking.tutorPhoneNumber}`}
                                >
                                    <span className="mr-2">📞</span> Call Provider
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-900"
                                onClick={handleMessageProvider}
                            >
                                <span className="mr-2">💬</span> Message Provider
                            </Button>
                        </>
                    )}

                    {booking.status === 'completed' && !booking.rated && (
                        <Button
                            className="w-full h-12 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-semibold"
                            onClick={() => setRatingModalOpen(true)}
                        >
                            <span className="mr-2">⭐</span> Rate Service
                        </Button>
                    )}

                    {booking.status === 'pending' && (
                        <Button
                            variant="ghost"
                            className="w-full h-12 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={handleCancelBooking}
                        >
                            Cancel Booking Request
                        </Button>
                    )}
                </div>
            </div>

            {/* Rating Modal */}
            <RatingModal
                isOpen={ratingModalOpen}
                onClose={() => setRatingModalOpen(false)}
                onSubmit={handleSubmitRating}
                tutorName={booking.tutorName || 'Service Provider'}
            />
        </div>
    );
}

export default function BookingDetailsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#005461] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <BookingDetailsContent />
        </Suspense>
    );
}
