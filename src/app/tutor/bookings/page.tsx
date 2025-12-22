'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { BookingService } from '@/lib/services/booking.service';
import { Booking } from '@/lib/types/database';
import { format, isToday, isFuture, isPast } from 'date-fns';
import { BackHeader } from '@/components/BackHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatService } from '@/lib/services/chat.service';

// Helper to safely convert timestamp to Date (handles both Firebase Timestamp and plain objects)
function toDateSafe(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
}

export default function TutorBookingsPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<(Booking & { id: string; studentPhoneNumber?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'>('all');

    // ... (state)

    // ... (useEffect)

    // ... (loadBookings)

    const handleMessage = async (bookingId: string, studentId: string) => {
        if (!user) return;
        try {
            // Check if chat exists first
            const existingChatId = await ChatService.findChat(studentId, user.uid, bookingId);

            if (existingChatId) {
                router.push(`/tutor/messages/detail?chatId=${existingChatId}`);
            } else {
                // Redirect with metadata to start a new chat LATER (on first message)
                router.push(`/tutor/messages/detail?studentId=${studentId}&bookingId=${bookingId}`);
            }
        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Failed to open chat');
        }
    };

    useEffect(() => {
        const queryFilter = searchParams.get('filter');
        if (queryFilter && ['all', 'pending', 'confirmed', 'in_progress', 'completed'].includes(queryFilter)) {
            setFilter(queryFilter as any);
        }
    }, [searchParams]);

    // Job completion form state
    const [completingJob, setCompletingJob] = useState<string | null>(null);
    const [completionCode, setCompletionCode] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [billDetails, setBillDetails] = useState('');
    const [startingJob, setStartingJob] = useState<string | null>(null);
    const [startCode, setStartCode] = useState('');

    const [tutorStats, setTutorStats] = useState({
        newRequests: 0,
        pendingJobs: 0,
        completedJobs: 0,
        totalEarnings: 0
    });

    useEffect(() => {
        if (user?.uid) {
            setLoading(true);
            const unsubscribe = BookingService.listenToTutorBookings(user.uid, (bookingsData) => {
                console.log('Real-time bookings update:', bookingsData.length);
                setBookings(bookingsData);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user?.uid]);

    // Fetch stats whenever bookings change or on load
    useEffect(() => {
        if (bookings.length > 0) {
            const pending = bookings.filter(b => b.status === 'pending').length;
            const ongoing = bookings.filter(b => b.status === 'in_progress').length; // "Pending Jobs" usually refers to active work
            const completed = bookings.filter(b => b.status === 'completed').length;

            // Calculate total earnings from completed jobs
            const earnings = bookings
                .filter(b => b.status === 'completed' && b.finalBillAmount)
                .reduce((sum, b) => sum + (b.finalBillAmount || 0), 0);

            // Pending earnings (from in_progress + confirmed, assuming base price or estimate)
            // For now, let's just use 0 or sum of base prices for pending jobs if needed
            const pendingEarnings = bookings
                .filter(b => (b.status === 'confirmed' || b.status === 'in_progress'))
                .reduce((sum, b) => sum + (b.totalPrice || 99), 0);

            setTutorStats({
                newRequests: pending,
                pendingJobs: bookings.filter(b => b.status === 'in_progress').length,
                completedJobs: completed,
                totalEarnings: earnings
            });
        }
    }, [bookings]);



    const handleAcceptBooking = async (bookingId: string) => {
        try {
            await BookingService.updateBookingStatus(bookingId, 'confirmed');
            // loadBookings(); // Auto-updated by listener
        } catch (error) {
            console.error('Failed to accept booking:', error);
            alert('Failed to accept booking');
        }
    };

    const handleDeclineBooking = async (bookingId: string) => {
        const reason = prompt('Reason for declining (optional):');
        try {
            await BookingService.cancelBooking(bookingId, reason || 'Declined by tutor');
            // loadBookings(); // Auto-updated by listener
        } catch (error) {
            console.error('Failed to decline booking:', error);
            alert('Failed to decline booking');
        }
    };

    const handleStartJob = async (bookingId: string) => {
        if (startCode.length !== 6) {
            alert('Please enter the 6-digit start code from the customer');
            return;
        }

        try {
            const code = await BookingService.startJobWithCode(bookingId, startCode);
            alert(`Job started! Customer's completion code: ${code}\n\nCustomer will share this code with you after work is done.`);
            setStartingJob(null);
            setStartCode('');
            // loadBookings(); // Auto-updated by listener
        } catch (error: any) {
            console.error('Failed to start job:', error);
            alert(error.message || 'Failed to start job');
        }
    };

    const handleCompleteJob = async (bookingId: string) => {
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
            setCompletingJob(null);
            setCompletionCode('');
            setBillAmount('');
            setBillDetails('');
            // loadBookings(); // Auto-updated by listener
        } catch (error: any) {
            console.error('Failed to complete job:', error);
            alert(error.message || 'Failed to complete job');
        }
    };

    const pendingAmount = bookings
        .filter(b => b.status === 'completed' && b.finalPaymentStatus === 'pending')
        .reduce((sum, b) => sum + (b.finalBillAmount || 0), 0);

    const filteredBookings = bookings.filter((booking) => {
        if (filter === 'all') return true;
        if (filter === 'completed') return booking.status === 'completed' || booking.status === 'cancelled';
        return booking.status === filter;
    }).sort((a, b) => {
        if (filter === 'pending') {
            const createdA = toDateSafe(a.createdAt).getTime();
            const createdB = toDateSafe(b.createdAt).getTime();
            return createdB - createdA;
        }
        const getTime = (b: Booking) => toDateSafe(b.date).getTime();
        return getTime(b) - getTime(a);
    });

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Requests' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'History' },
    ];

    if (!userData || userData.role !== 'tutor') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Access denied. Provider verification required.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header Structure */}
            <div className="bg-[#5A0E24] text-white">
                {/* Fixed Title Section */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-[#5A0E24] pt-8 pb-4 px-4 shadow-md">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">My Services</h1>
                            <p className="text-gray-200 text-sm">Manage your bookings</p>
                        </div>
                    </div>
                </div>

                {/* Spacer for Fixed Header */}
                <div className="h-[88px] bg-[#5A0E24]"></div>

                {/* Scrollable Content (Stats & Filters) */}
                <div className="px-4 pb-4 bg-[#5A0E24]">
                    {/* Stats Tiles */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl relative overflow-hidden group hover:bg-white/15 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-white/20 transition-all"></div>
                            <p className="text-gray-200 text-xs font-medium uppercase tracking-wider mb-1">Pending Amount</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-3xl font-bold text-white">₹{pendingAmount}</h3>
                                <span className="text-[10px] text-gray-300">waiting</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#771532] to-[#450a1b] p-4 rounded-2xl shadow-lg border border-[#white]/10 relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#5A0E24] rounded-full -mr-4 -mb-4 blur-xl"></div>
                            <p className="text-gray-200 text-xs font-medium uppercase tracking-wider mb-1">Pending Jobs</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-3xl font-bold text-white">{tutorStats.pendingJobs}</h3>
                                <span className="text-[10px] text-gray-300">active</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.id
                                    ? 'bg-white text-[#5A0E24] shadow-md'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Bookings List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-[#5A0E24] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                {filter === 'all' && 'No bookings found'}
                                {filter !== 'all' && `No ${filter.replace('_', ' ')} bookings`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <Card key={booking.id} className="border-l-4 border-l-[#5A0E24] shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="mb-3">
                                                {/* Customer Name Row */}
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {booking.studentName || 'Customer'}
                                                </h3>
                                                {/* Status Badges */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge
                                                        className={`${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                            booking.status === 'pending' ? 'bg-[#5A0E24]/10 text-[#5A0E24]' :
                                                                booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            } border-none`}
                                                    >
                                                        {booking.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${booking.paymentStatus === 'paid' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}`}
                                                    >
                                                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                                    </Badge>
                                                    <span className="text-sm font-bold text-gray-900 ml-1">
                                                        {booking.status === 'completed' && booking.finalBillAmount
                                                            ? `Total: ₹${booking.finalBillAmount}`
                                                            : 'Visit: ₹99'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 my-2">
                                                <div className="w-10 h-10 rounded-lg bg-[#5A0E24]/10 flex flex-col items-center justify-center text-[#5A0E24]">
                                                    <span className="text-[9px] uppercase font-bold">
                                                        {format(toDateSafe(booking.date), 'MMM')}
                                                    </span>
                                                    <span className="text-lg font-bold leading-none">
                                                        {format(toDateSafe(booking.date), 'dd')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">
                                                        {format(toDateSafe(booking.date), 'EEEE')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {booking.startTime}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 pl-1">
                                                {booking.subject && (
                                                    <p className="text-sm text-gray-600">
                                                        📚 {booking.subject}
                                                    </p>
                                                )}
                                                {booking.notes && (
                                                    <p className="text-xs text-muted-foreground italic mt-1">
                                                        "{booking.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">


                                            {booking.status === 'pending' && (
                                                <div className="flex gap-2 w-full justify-end">
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

                                            {/* Start Job Form - for confirmed bookings */}
                                            {booking.status === 'confirmed' && (
                                                <div className="flex flex-col gap-2 items-end w-full">
                                                    {startingJob === booking.id ? (
                                                        <div className="mt-2 p-3 border-2 border-green-500 rounded-lg bg-green-50 w-full animate-in fade-in slide-in-from-top-2">
                                                            <h4 className="font-semibold text-sm mb-2 text-green-800">🚀 Start Job</h4>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <label className="block text-xs font-medium mb-1 text-green-700">
                                                                        Enter Start Code from Customer
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="6-digit code"
                                                                        maxLength={6}
                                                                        className="w-full p-2 border rounded-md font-mono text-center tracking-widest"
                                                                        value={startCode}
                                                                        onChange={(e) => setStartCode(e.target.value.replace(/\D/g, ''))}
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setStartingJob(null);
                                                                            setStartCode('');
                                                                        }}
                                                                        className="flex-1 text-xs"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleStartJob(booking.id)}
                                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                                                        disabled={startCode.length !== 6}
                                                                    >
                                                                        Start
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setStartingJob(booking.id)}
                                                            className="bg-green-600 hover:bg-green-700 w-full"
                                                        >
                                                            🚀 Start Job
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* In Progress Status */}
                                            {booking.status === 'in_progress' && completingJob !== booking.id && (
                                                <div className="w-full">

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

                                    {/* Action Row: View Details + Actions are above */}
                                    {/* Action Row */}
                                    {/* Action Row */}
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                                        {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                                            <>
                                                {booking.studentPhoneNumber && (
                                                    <a
                                                        href={`tel:${booking.studentPhoneNumber}`}
                                                        className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 h-10 px-2"
                                                    >
                                                        📞 Call
                                                    </a>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMessage(booking.id, booking.studentId)}
                                                    className="flex-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 h-10 px-2"
                                                >
                                                    💬 Message
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/tutor/booking-details?id=${booking.id}`)}
                                            className="flex-1 text-[#5A0E24] hover:bg-[#5A0E24]/5 border-[#5A0E24]/20 h-10 px-2"
                                        >
                                            View Details
                                        </Button>
                                    </div>

                                    {/* Complete Job Form */}
                                    {booking.status === 'in_progress' && completingJob === booking.id && (
                                        <div className="mt-6 p-4 border-2 border-primary rounded-lg bg-primary/5 animate-in fade-in slide-in-from-top-2">
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
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-sm">✔ Job Completed</h4>
                                                        {booking.finalPaymentStatus === 'completed' && (
                                                            <Badge variant="default" className="bg-green-600 h-5 px-2 text-[10px]">
                                                                ✔ Paid
                                                            </Badge>
                                                        )}
                                                        {booking.finalPaymentStatus === 'pending' && (
                                                            <Badge variant="outline" className="text-[#5A0E24] border-[#5A0E24]/20 bg-[#5A0E24]/5 h-5 px-2 text-[10px]">
                                                                Waiting
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Final Bill: ₹{booking.finalBillAmount}
                                                    </p>
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
        </div>
    );
}
