'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingService } from '@/lib/services/booking.service';
import { ChatService } from '@/lib/services/chat.service';
import { Booking } from '@/lib/types/database';
import { format } from 'date-fns';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

function BookingDetailsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');

    const [booking, setBooking] = useState<(Booking & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);

    // Action states
    const [startCode, setStartCode] = useState('');
    const [completingJob, setCompletingJob] = useState(false);
    const [completionCode, setCompletionCode] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [billDetails, setBillDetails] = useState('');
    const [startingJob, setStartingJob] = useState(false);

    useEffect(() => {
        if (user?.uid && bookingId) {
            loadBookingDetails();
        }
    }, [user?.uid, bookingId]);

    const loadBookingDetails = async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const bookingData = await BookingService.getBookingById(bookingId);
            if (bookingData) {
                setBooking({ ...bookingData, id: bookingId });
            } else {
                alert('Booking not found');
                router.back();
            }
        } catch (error) {
            console.error('Failed to load booking:', error);
            alert('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = async () => {
        if (!booking || !user) return;
        try {
            // Check if chat exists first
            const existingChatId = await ChatService.findChat(booking.studentId, user.uid, booking.id);

            if (existingChatId) {
                router.push(`/tutor/messages/detail?chatId=${existingChatId}`);
            } else {
                // Redirect with metadata to start a new chat LATER (on first message)
                router.push(`/tutor/messages/detail?studentId=${booking.studentId}&bookingId=${booking.id}`);
            }
        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Failed to open chat');
        }
    };

    const handleAcceptBooking = async () => {
        if (!booking) return;
        try {
            await BookingService.updateBookingStatus(booking.id, 'confirmed');
            loadBookingDetails();
        } catch (error) {
            console.error('Failed to accept booking:', error);
            alert('Failed to accept booking');
        }
    };

    const handleDeclineBooking = async () => {
        if (!booking) return;
        const reason = prompt('Reason for declining (optional):');
        try {
            await BookingService.cancelBooking(booking.id, reason || 'Declined by tutor');
            router.back();
        } catch (error) {
            console.error('Failed to decline booking:', error);
            alert('Failed to decline booking');
        }
    };

    const handleStartJob = async () => {
        if (!booking) return;
        if (startCode.length !== 6) {
            alert('Please enter the 6-digit start code from the customer');
            return;
        }

        try {
            const code = await BookingService.startJobWithCode(booking.id, startCode);
            alert(`Job started! Customer's completion code: ${code}\n\nCustomer will share this code with you after work is done.`);
            setStartingJob(false);
            setStartCode('');
            loadBookingDetails();
        } catch (error: any) {
            console.error('Failed to start job:', error);
            alert(error.message || 'Failed to start job');
        }
    };

    const handleCompleteJob = async () => {
        if (!booking) return;
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
            await BookingService.completeJob(booking.id, completionCode, amount, billDetails);
            alert('Job completed successfully! Customer can now make payment.');
            setCompletingJob(false);
            setCompletionCode('');
            setBillAmount('');
            setBillDetails('');
            loadBookingDetails();
        } catch (error: any) {
            console.error('Failed to complete job:', error);
            alert(error.message || 'Failed to complete job');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#5A0E24] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!booking) return null;

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <BackHeader
                title="Service Details"
                className="!bg-[#5A0E24] !border-none !text-white p-4"
            />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Status Section */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                    <span className="text-sm font-semibold text-gray-500">Status</span>
                    <Badge
                        className={`${booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border-none' :
                            booking.status === 'pending' ? 'bg-[#5A0E24]/10 text-[#5A0E24] border-none' :
                                booking.status === 'completed' ? 'bg-gray-100 text-gray-800 border-none' :
                                    'bg-gray-100 text-gray-800 border-none'
                            } px-4 py-1.5 text-sm font-medium rounded-full capitalize`}
                    >
                        {booking.status.replace('_', ' ')}
                    </Badge>
                </div>

                {/* Customer Details */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Customer Details</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#5A0E24]/10 text-[#5A0E24] flex items-center justify-center text-xl font-bold">
                            {booking.studentName?.[0] || 'C'}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">{booking.studentName || 'Customer'}</h2>
                            <p className="text-sm text-gray-500">Service Request</p>
                        </div>
                    </div>
                    {booking.address && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex gap-3">
                                <span className="text-xl">📍</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Service Location</p>
                                    <p className="text-sm text-gray-600 mt-1">{booking.address}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Actions for Active Jobs */}
                    {['confirmed', 'in_progress'].includes(booking.status) && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                            {(booking as any).studentPhoneNumber && (
                                <a
                                    href={`tel:${(booking as any).studentPhoneNumber}`}
                                    className="flex-1 inline-flex items-center justify-center h-12 rounded-xl text-sm font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                                >
                                    📞 Call
                                </a>
                            )}
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                                onClick={handleMessage}
                            >
                                💬 Message
                            </Button>
                        </div>
                    )}
                </div>

                {/* Service Info */}
                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Info</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#5A0E24]/5 rounded-xl p-4">
                            <span className="block text-xs font-bold text-[#5A0E24] uppercase tracking-wider mb-1">Date</span>
                            <span className="block text-lg font-bold text-gray-900">{format(booking.date.toDate(), 'MMM dd, yyyy')}</span>
                            <span className="block text-xs text-gray-500">{format(booking.date.toDate(), 'EEEE')}</span>
                        </div>
                        <div className="bg-[#5A0E24]/5 rounded-xl p-4">
                            <span className="block text-xs font-bold text-[#5A0E24] uppercase tracking-wider mb-1">Time</span>
                            <span className="block text-lg font-bold text-gray-900">{booking.startTime}</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <p className="text-sm font-medium text-gray-900">Service Required</p>
                        <p className="text-sm text-gray-600 mt-1">{booking.subject || 'General Service'}</p>
                        {booking.notes && (
                            <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 p-3 rounded-lg">"{booking.notes}"</p>
                        )}
                    </div>
                </div>

                {/* Actions & Implementation Forms */}

                {/* Pending: Accept/Decline */}
                {booking.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={handleDeclineBooking}
                        >
                            Decline
                        </Button>
                        <Button
                            className="h-12 bg-[#5A0E24] hover:bg-[#450a1b] text-white"
                            onClick={handleAcceptBooking}
                        >
                            Accept Request
                        </Button>
                    </div>
                )}

                {/* Confirmed: Start Job */}
                {booking.status === 'confirmed' && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-green-100">
                        <h3 className="text-sm font-bold text-green-800 mb-4 flex items-center gap-2">
                            🚀 Ready to Start?
                        </h3>

                        {startingJob ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600 uppercase">
                                        Enter Start Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full p-3 border-2 border-green-200 rounded-xl font-mono text-2xl text-center tracking-[0.5em] focus:border-green-500 focus:outline-none transition-all"
                                        value={startCode}
                                        onChange={(e) => setStartCode(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                    <p className="text-xs text-center text-gray-500 mt-2">Ask the customer for the 6-digit start code</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-12"
                                        onClick={() => setStartingJob(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="h-12 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleStartJob}
                                        disabled={startCode.length !== 6}
                                    >
                                        VERIFY & START
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg"
                                onClick={() => setStartingJob(true)}
                            >
                                START JOB
                            </Button>
                        )}
                    </div>
                )}

                {/* In Progress: Complete Job */}
                {booking.status === 'in_progress' && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-[#5A0E24]/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-[#5A0E24] flex items-center gap-2">
                                ⏳ Job In Progress
                            </h3>
                            <span className="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span>
                        </div>

                        {completingJob ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600 uppercase">
                                        Completion Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full p-3 border rounded-xl font-mono text-xl text-center tracking-[0.5em]"
                                        value={completionCode}
                                        onChange={(e) => setCompletionCode(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600 uppercase">
                                        Total Bill Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        className="w-full p-3 border rounded-xl text-lg font-semibold"
                                        value={billAmount}
                                        onChange={(e) => setBillAmount(e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600 uppercase">
                                        Work Summary
                                    </label>
                                    <textarea
                                        placeholder="Describe the work done..."
                                        className="w-full p-3 border rounded-xl min-h-[100px]"
                                        value={billDetails}
                                        onChange={(e) => setBillDetails(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="h-12"
                                        onClick={() => setCompletingJob(false)}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        className="h-12 bg-[#5A0E24] hover:bg-[#450a1b] text-white"
                                        onClick={handleCompleteJob}
                                    >
                                        COMPLETE JOB
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-lg"
                                onClick={() => setCompletingJob(true)}
                            >
                                MARK COMPLETED
                            </Button>
                        )}
                    </div>
                )}

                {/* Completed Details */}
                {booking.status === 'completed' && booking.finalBillAmount && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Payment Status</h3>
                            <Badge
                                variant={booking.finalPaymentStatus === 'completed' ? 'default' : 'outline'}
                                className={booking.finalPaymentStatus === 'completed' ? 'bg-green-600 text-white' : 'text-gray-600 border-gray-300'}
                            >
                                {booking.finalPaymentStatus === 'completed' ? 'PAID' : 'PENDING'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-gray-500">Final Bill</span>
                            <span className="text-2xl font-bold text-gray-900">₹{booking.finalBillAmount}</span>
                        </div>
                        {booking.finalPaymentStatus === 'pending' && (
                            <p className="text-xs text-center text-gray-400 mt-4">
                                Waiting for customer to clear the payment.
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default function BookingDetailsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#5A0E24] rounded-full animate-spin border-t-transparent"></div>
            </div>
        }>
            <BookingDetailsContent />
        </Suspense>
    );
}
