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

export default function StudentBookingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<(Booking & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
    const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);

    // Rating modal state
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<(Booking & { id: string }) | null>(null);

    useEffect(() => {
        if (user) {
            loadBookings();
        }
    }, [user]);

    const loadBookings = async () => {
        if (!user) return;

        setLoading(true);
        try {
            console.log('Loading bookings for student:', user.uid);
            const allBookings = await BookingService.getStudentBookings(user.uid);
            console.log('Student bookings fetched:', allBookings);
            console.log('Number of bookings:', allBookings.length);
            setBookings(allBookings);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await BookingService.cancelBooking(bookingId, 'Cancelled by student');
            loadBookings();
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
            loadBookings();
        } catch (error) {
            console.error('Failed to regenerate code:', error);
            alert('Failed to regenerate code');
        } finally {
            setRegeneratingCode(null);
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
            loadBookings();
        } catch (error: any) {
            console.error('Failed to submit rating:', error);
            alert(error.message || 'Failed to submit rating');
        }
    };

    const handleMessageProvider = async (tutorId: string) => {
        if (!user) return;

        try {
            const chatId = await ChatService.getOrCreateChat(user.uid, tutorId);
            router.push(`/student/messages?chatId=${chatId}`);
        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Failed to open chat');
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        const bookingDate = booking.date.toDate();

        if (filter === 'upcoming') {
            return booking.status !== 'cancelled' && booking.status !== 'completed' && (isFuture(bookingDate) || isToday(bookingDate));
        } else if (filter === 'past') {
            return booking.status === 'completed' || booking.status === 'cancelled' || (isPast(bookingDate) && !isToday(bookingDate));
        } else {
            return booking.status === 'cancelled';
        }
    });

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in to view your bookings</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
                <p className="text-muted-foreground">Manage your service bookings</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b">
                <button
                    onClick={() => setFilter('upcoming')}
                    className={`pb-3 px-4 border-b-2 transition-colors ${filter === 'upcoming'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Upcoming ({bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && (isFuture(b.date.toDate()) || isToday(b.date.toDate()))).length})
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`pb-3 px-4 border-b-2 transition-colors ${filter === 'past'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Past ({bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || (isPast(b.date.toDate()) && !isToday(b.date.toDate()))).length})
                </button>
                <button
                    onClick={() => setFilter('cancelled')}
                    className={`pb-3 px-4 border-b-2 transition-colors ${filter === 'cancelled'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
                </button>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredBookings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            {filter === 'upcoming' && 'No upcoming services'}
                            {filter === 'past' && 'No past services'}
                            {filter === 'cancelled' && 'No cancelled services'}
                        </p>
                        <Link href="/search">
                            <Button>
                                Find a Service Provider
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold">
                                                {booking.tutorName || 'Service Provider'}
                                            </h3>
                                            <Badge
                                                variant={
                                                    booking.status === 'confirmed' ? 'default' :
                                                        booking.status === 'pending' ? 'outline' :
                                                            booking.status === 'completed' ? 'default' :
                                                                'outline'
                                                }
                                            >
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </Badge>
                                            <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'outline'}>
                                                {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 text-sm">
                                            <p className="text-muted-foreground">
                                                📅 {format(booking.date.toDate(), 'EEEE, MMMM dd, yyyy')}
                                            </p>
                                            <p className="text-muted-foreground">
                                                🕐 {booking.startTime} - {booking.endTime} ({booking.duration} minutes)
                                            </p>
                                            {booking.subject && (
                                                <p className="text-muted-foreground">
                                                    📚 Subject: {booking.subject}
                                                </p>
                                            )}
                                            {booking.notes && (
                                                <p className="text-muted-foreground">
                                                    📝 {booking.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Completion Code Display - When job is in progress */}
                                        {booking.status === 'in_progress' && booking.completionCode && (
                                            <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-primary/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-sm">🔐 Job Completion Code</h4>
                                                    {booking.codeExpiresAt && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Expires: {format(booking.codeExpiresAt.toDate(), 'MMM dd, h:mm a')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-4xl font-bold text-primary text-center my-3 tracking-widest font-mono">
                                                    {booking.completionCode}
                                                </div>
                                                <p className="text-xs text-muted-foreground text-center mb-2">
                                                    Share this code with the provider after they complete the work
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full mt-2 text-xs"
                                                    onClick={() => handleRegenerateCode(booking.id)}
                                                    disabled={regeneratingCode === booking.id}
                                                >
                                                    {regeneratingCode === booking.id ? 'Generating...' : '🔄 Generate New Code'}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Final Bill Display - When job is completed */}
                                        {booking.status === 'completed' && booking.finalBillAmount && (
                                            <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                                <h4 className="font-semibold text-sm mb-2">📄 Final Bill</h4>
                                                <div className="text-3xl font-bold text-primary mb-2">
                                                    ₹{booking.finalBillAmount}
                                                </div>
                                                {booking.billDetails && (
                                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                        {booking.billDetails}
                                                    </p>
                                                )}
                                                {booking.billSubmittedAt && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Bill submitted: {format(booking.billSubmittedAt.toDate(), 'MMM dd, h:mm a')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-2xl font-bold text-primary">
                                            {booking.status === 'completed' && booking.finalBillAmount
                                                ? `₹${booking.finalBillAmount}`
                                                : 'Visit: ₹99'}
                                        </div>

                                        {filter === 'upcoming' && booking.status !== 'cancelled' && (
                                            <div className="flex gap-2">
                                                {booking.status === 'pending' && (
                                                    <Badge variant="outline" className="text-yellow-600">
                                                        Waiting for provider to accept
                                                    </Badge>
                                                )}
                                                {booking.status === 'in_progress' && (
                                                    <Badge variant="default" className="bg-blue-600">
                                                        🚀 Work in Progress
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Payment Section - After job completion */}
                                        {booking.status === 'completed' && booking.finalBillAmount && (
                                            <div className="flex flex-col gap-2 items-end">
                                                {booking.finalPaymentStatus === 'pending' && (
                                                    <RazorpayPayment
                                                        amount={booking.finalBillAmount}
                                                        bookingId={booking.id}
                                                        isFinalPayment={true}
                                                        onSuccess={() => {
                                                            alert('Payment successful!');
                                                            loadBookings();
                                                        }}
                                                        onFailure={(error) => {
                                                            alert(`Payment failed: ${error}`);
                                                        }}
                                                    />
                                                )}

                                                {booking.finalPaymentStatus === 'completed' && booking.paidAt && (
                                                    <Badge variant="default" className="bg-green-600">
                                                        ✓ Paid on {format(booking.paidAt.toDate(), 'MMM dd')}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Message Provider Button - for confirmed and in-progress bookings */}
                                        {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleMessageProvider(booking.tutorId)}
                                            >
                                                💬 Message Provider
                                            </Button>
                                        )}

                                        {/* Rate Service Button/Badge - for completed bookings */}
                                        {filter === 'past' && booking.status === 'completed' && (
                                            booking.rated ? (
                                                <Badge variant="default" className="bg-yellow-500">
                                                    ⭐ Rated
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenRatingModal(booking)}
                                                >
                                                    ⭐ Rate Service
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
    );
}
