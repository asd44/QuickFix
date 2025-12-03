'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { BookingService } from '@/lib/services/booking.service';
import { Booking } from '@/lib/types/database';
import { format, isToday, isFuture, isPast } from 'date-fns';

export default function TutorBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<(Booking & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'today' | 'upcoming' | 'requests' | 'past'>('today');

    // Job completion form state
    const [completingJob, setCompletingJob] = useState<string | null>(null);
    const [completionCode, setCompletionCode] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [billDetails, setBillDetails] = useState('');
    const [startingJob, setStartingJob] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadBookings();
        }
    }, [user]);

    const loadBookings = async () => {
        if (!user) return;

        setLoading(true);
        try {
            console.log('Loading bookings for tutor:', user.uid);
            const allBookings = await BookingService.getTutorBookings(user.uid);
            console.log('Bookings fetched:', allBookings);
            console.log('Number of bookings:', allBookings.length);
            setBookings(allBookings);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptBooking = async (bookingId: string) => {
        try {
            await BookingService.updateBookingStatus(bookingId, 'confirmed');
            loadBookings();
        } catch (error) {
            console.error('Failed to accept booking:', error);
            alert('Failed to accept booking');
        }
    };

    const handleDeclineBooking = async (bookingId: string) => {
        const reason = prompt('Reason for declining (optional):');
        try {
            await BookingService.cancelBooking(bookingId, reason || 'Declined by tutor');
            loadBookings();
        } catch (error) {
            console.error('Failed to decline booking:', error);
            alert('Failed to decline booking');
        }
    };

    const handleMarkCompleted = async (bookingId: string) => {
        try {
            await BookingService.updateBookingStatus(bookingId, 'completed');
            loadBookings();
        } catch (error) {
            console.error('Failed to mark as completed:', error);
            alert('Failed to mark as completed');
        }
    };

    const handleStartJob = async (bookingId: string) => {
        if (!confirm('Start this job? A completion code will be generated for the customer.')) return;

        setStartingJob(bookingId);
        try {
            const code = await BookingService.startJob(bookingId);
            alert(`Job started! Customer's completion code: ${code}\n\nCustomer will share this code with you after work is done.`);
            loadBookings();
        } catch (error) {
            console.error('Failed to start job:', error);
            alert('Failed to start job');
        } finally {
            setStartingJob(null);
        }
    };

    const handleCompleteJob = async (bookingId: string) => {
        // Validation
        if (completionCode.length !== 6) {
            alert('Please enter the 6-digit completion code from the customer');
            return;
        }

        const amount = parseFloat(billAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid bill amount greater than 0');
            return;
        }

        if (!billDetails.trim()) {
            alert('Please provide bill details (work done, materials used, etc.)');
            return;
        }

        try {
            await BookingService.completeJob(bookingId, completionCode, amount, billDetails);
            alert('Job completed successfully! Customer can now make payment.');

            // Reset form
            setCompletingJob(null);
            setCompletionCode('');
            setBillAmount('');
            setBillDetails('');
            loadBookings();
        } catch (error: any) {
            console.error('Failed to complete job:', error);
            alert(error.message || 'Failed to complete job');
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        const bookingDate = booking.date.toDate();

        if (filter === 'today') {
            return isToday(bookingDate) && booking.status !== 'cancelled' && booking.status !== 'completed';
        } else if (filter === 'upcoming') {
            return isFuture(bookingDate) && booking.status !== 'cancelled' && booking.status !== 'completed' && !isToday(bookingDate);
        } else if (filter === 'requests') {
            return booking.status === 'pending';
        } else {
            // past - show completed, cancelled, or past date bookings
            return booking.status === 'completed' || booking.status === 'cancelled' || isPast(bookingDate);
        }
    });

    // Calculate earnings
    const totalEarnings = bookings
        .filter(b => b.status === 'completed' && b.finalPaymentStatus === 'completed')
        .reduce((sum, b) => sum + (b.finalBillAmount || 0), 0);

    const pendingEarnings = bookings
        .filter(b => b.status === 'completed' && b.finalPaymentStatus === 'pending')
        .reduce((sum, b) => sum + (b.finalBillAmount || 0), 0);

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
                <h1 className="text-3xl font-bold mb-2">My Services</h1>
                <p className="text-muted-foreground">Manage your service bookings and earnings</p>
            </div>

            {/* Earnings Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                        <p className="text-3xl font-bold text-primary">₹{totalEarnings.toFixed(0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Pending Earnings</p>
                        <p className="text-3xl font-bold text-yellow-600">₹{pendingEarnings.toFixed(0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Services</p>
                        <p className="text-3xl font-bold">{bookings.filter(b => b.status === 'completed').length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b overflow-x-auto">
                <button
                    onClick={() => setFilter('today')}
                    className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${filter === 'today'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Today ({bookings.filter(b => isToday(b.date.toDate()) && b.status !== 'cancelled' && b.status !== 'completed').length})
                </button>
                <button
                    onClick={() => setFilter('upcoming')}
                    className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${filter === 'upcoming'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Upcoming ({bookings.filter(b => isFuture(b.date.toDate()) && b.status !== 'cancelled' && b.status !== 'completed' && !isToday(b.date.toDate())).length})
                </button>
                <button
                    onClick={() => setFilter('requests')}
                    className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${filter === 'requests'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Requests ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${filter === 'past'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Past ({bookings.filter(b => isPast(b.date.toDate()) || b.status === 'completed' || b.status === 'cancelled').length})
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
                        <p className="text-muted-foreground">
                            {filter === 'today' && 'No bookings today'}
                            {filter === 'upcoming' && 'No upcoming bookings'}
                            {filter === 'requests' && 'No pending requests'}
                            {filter === 'past' && 'No past bookings'}
                        </p>
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
                                                {booking.studentName || 'Customer'}
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
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-2xl font-bold text-primary">
                                            {booking.status === 'completed' && booking.finalBillAmount
                                                ? `₹${booking.finalBillAmount}`
                                                : 'Visit: ₹99'}
                                        </div>

                                        {booking.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeclineBooking(booking.id)}
                                                >
                                                    Decline
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAcceptBooking(booking.id)}
                                                >
                                                    Accept
                                                </Button>
                                            </div>
                                        )}

                                        {/* Start Job Button - for confirmed bookings */}
                                        {booking.status === 'confirmed' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleStartJob(booking.id)}
                                                disabled={startingJob === booking.id}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {startingJob === booking.id ? 'Starting...' : '🚀 Start Job'}
                                            </Button>
                                        )}

                                        {/* In Progress Status */}
                                        {booking.status === 'in_progress' && completingJob !== booking.id && (
                                            <div>
                                                <Badge variant="default" className="bg-blue-600 mb-2">
                                                    🚀 Work in Progress
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setCompletingJob(booking.id)}
                                                    className="w-full"
                                                >
                                                    Complete Job
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Complete Job Form */}
                                {booking.status === 'in_progress' && completingJob === booking.id && (
                                    <div className="mt-6 p-4 border-2 border-primary rounded-lg bg-primary/5">
                                        <h4 className="font-semibold mb-4">✔ Complete Job</h4>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">
                                                    Completion Code from Customer *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter 6-digit code"
                                                    maxLength={6}
                                                    className="w-full p-2 border rounded-md font-mono text-lg tracking-widest"
                                                    value={completionCode}
                                                    onChange={(e) => setCompletionCode(e.target.value.replace(/\D/g, ''))}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">
                                                    Final Bill Amount (₹) *
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Total amount (including ₹99 visiting charge)"
                                                    className="w-full p-2 border rounded-md"
                                                    value={billAmount}
                                                    onChange={(e) => setBillAmount(e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">
                                                    Bill Details *
                                                </label>
                                                <textarea
                                                    placeholder="Describe work done, materials used, etc."
                                                    className="w-full p-2 border rounded-md"
                                                    rows={4}
                                                    value={billDetails}
                                                    onChange={(e) => setBillDetails(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCompletingJob(null);
                                                        setCompletionCode('');
                                                        setBillAmount('');
                                                        setBillDetails('');
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCompleteJob(booking.id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    ✔ Submit & Complete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Completed Job Info */}
                                {booking.status === 'completed' && booking.finalBillAmount && (
                                    <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-sm">✔ Job Completed</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Final Bill: ₹{booking.finalBillAmount}
                                                </p>
                                                {booking.finalPaymentStatus === 'pending' && (
                                                    <Badge variant="outline" className="mt-2 text-yellow-600">
                                                        Waiting for payment
                                                    </Badge>
                                                )}
                                                {booking.finalPaymentStatus === 'completed' && (
                                                    <Badge variant="default" className="mt-2 bg-green-600">
                                                        ✔ Paid
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
