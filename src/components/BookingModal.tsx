'use client';

import { useState, useEffect, useRef } from 'react';
import { format, addMinutes } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface BookingModalProps {
    tutorId: string;
    tutorName: string;
    hourlyRate: number;
    onClose: () => void;
    onBook: (bookingData: BookingData) => Promise<void>;
}

import { BookingService } from '@/lib/services/booking.service';

export interface BookingData {
    date: Date;
    startTime: string;
    duration: number;
    notes: string;
}

const DURATION_OPTIONS = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
];

const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

export function BookingModal({ tutorId, tutorName, onClose, onBook }: Omit<BookingModalProps, 'hourlyRate'>) {
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const VISITING_CHARGE = 99;

    // Fetch booked slots when date changes
    useEffect(() => {
        if (selectedDate && tutorId) {
            setLoading(true); // Re-use loading or create separate loading state if needed
            BookingService.getBookedSlots(tutorId, selectedDate)
                .then(slots => {
                    setBookedSlots(slots);
                })
                .catch(err => {
                    console.error("Failed to fetch booked slots", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setBookedSlots([]);
        }
    }, [selectedDate, tutorId]);

    const calculateEndTime = (startTime: string) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const start = new Date();
        start.setHours(hours, minutes, 0, 0);
        // Default inspection duration is 60 mins for scheduling purposes
        const end = addMinutes(start, 60);
        return format(end, 'HH:mm');
    };

    const isSubmittingRef = useRef(false);

    const handleBookSession = async () => {
        if (!selectedDate || !selectedTime) {
            alert('Please select both date and time');
            return;
        }

        // Synchronous check to prevent double submission
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        setLoading(true);
        try {
            await onBook({
                date: selectedDate,
                startTime: selectedTime,
                duration: 60, // Default 1 hour slot for inspection
                notes,
            });

            // Success is handled by the parent component closing the modal
        } catch (error: any) {
            console.error('Booking failed:', error);
            // Error is already alerted by parent, but we can set a local error state if we want better UI
            // Reset ref on error so user can try again
            isSubmittingRef.current = false;
        } finally {
            setLoading(false);
            // Note: We don't reset isSubmittingRef.current = false here on success 
            // because the modal will close. If it doesn't close on success, we would need to reset it.
            // But usually on success we unmount or redirect. 
            // In case of error it is reset in catch.
        }
    };

    // Disable past dates
    const disabledDays = { before: new Date() };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 pb-20 sm:pb-4">
            <Card className="w-full max-w-2xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
                <CardHeader className="border-b sticky top-0 bg-background z-10">
                    <div className="flex items-center justify-between">
                        <CardTitle>Book Service with {tutorName}</CardTitle>
                        <button
                            onClick={onClose}
                            className="text-2xl hover:text-primary transition-colors"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Date Picker */}
                    <div>
                        <h3 className="font-semibold mb-3">Select Date</h3>
                        <div className="flex justify-center">
                            <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={disabledDays}
                                className="border rounded-md p-3"
                            />
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                        <div>
                            <h3 className="font-semibold mb-3">Select Time</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {TIME_SLOTS.map((time) => {
                                    const isBooked = bookedSlots.includes(time);
                                    let slotClass = "p-2 rounded-md border-2 transition-colors text-sm relative ";

                                    if (selectedTime === time) {
                                        slotClass += "border-primary bg-primary/10 text-primary font-semibold";
                                    } else if (isBooked) {
                                        slotClass += "border-red-200 bg-red-50 text-red-400 cursor-not-allowed decoration-slice";
                                    } else {
                                        slotClass += "border-green-200 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100";
                                    }

                                    return (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            disabled={isBooked}
                                            className={slotClass}
                                            title={isBooked ? 'Slot already booked' : 'Available slot'}
                                        >
                                            <span className={isBooked ? 'line-through' : ''}>{time}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Session Summary */}
                    {selectedDate && selectedTime && (
                        <div className="bg-muted p-4 rounded-md space-y-2">
                            <h3 className="font-semibold mb-2">Service Summary</h3>
                            <div className="text-sm space-y-1">
                                <p>
                                    <span className="text-muted-foreground">Date:</span>{' '}
                                    <span className="font-semibold">{format(selectedDate, 'MMMM dd, yyyy')}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Time:</span>{' '}
                                    <span className="font-semibold">
                                        {selectedTime}
                                    </span>
                                </p>
                                <div className="pt-2 border-t border-border mt-2">
                                    <p className="text-lg">
                                        <span className="text-muted-foreground">Visiting Charge:</span>{' '}
                                        <span className="font-bold text-primary">₹{VISITING_CHARGE}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        * Final service cost will be quoted after inspection.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <h3 className="font-semibold mb-3">Description of Issue (Optional)</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the problem or service needed..."
                            className="w-full p-3 border rounded-md min-h-[100px] resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">{notes.length}/500 characters</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBookSession}
                            className="flex-1"
                            disabled={!selectedDate || !selectedTime || loading}
                        >
                            {loading ? 'Processing...' : 'Book Service'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
