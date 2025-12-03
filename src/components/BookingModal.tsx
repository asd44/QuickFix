'use client';

import { useState } from 'react';
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

export function BookingModal({ tutorId, tutorName, hourlyRate, onClose, onBook }: BookingModalProps) {
    console.log('BookingModal opened with hourlyRate:', hourlyRate);

    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [duration, setDuration] = useState<number>(60);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const calculatePrice = () => {
        const price = ((duration / 60) * hourlyRate).toFixed(2);
        console.log('Calculating price:', { duration, hourlyRate, price });
        return price;
    };

    const calculateEndTime = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const start = new Date();
        start.setHours(hours, minutes, 0, 0);
        const end = addMinutes(start, durationMinutes);
        return format(end, 'HH:mm');
    };

    const handleBookSession = async () => {
        if (!selectedDate || !selectedTime) {
            alert('Please select both date and time');
            return;
        }

        setLoading(true);
        try {
            // Create booking first
            await onBook({
                date: selectedDate,
                startTime: selectedTime,
                duration,
                notes,
            });

            // Show success message - booking created but payment pending
            alert('Booking created! Please complete payment to confirm.');
            setLoading(false);

            // Note: Payment will be handled from the student bookings page
            // Or we can proceed to payment right here
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Failed to create booking. Please try again.');
            setLoading(false);
        }
    };

    // Disable past dates
    const disabledDays = { before: new Date() };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b sticky top-0 bg-background z-10">
                    <div className="flex items-center justify-between">
                        <CardTitle>Book Session with {tutorName}</CardTitle>
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

                    {/* Duration Selection */}
                    <div>
                        <h3 className="font-semibold mb-3">Session Duration</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {DURATION_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setDuration(option.value)}
                                    className={`p-3 rounded-md border-2 transition-colors ${duration === option.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="font-semibold">{option.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                        <div>
                            <h3 className="font-semibold mb-3">Select Time</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {TIME_SLOTS.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`p-2 rounded-md border-2 transition-colors text-sm ${selectedTime === time
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Session Summary */}
                    {selectedDate && selectedTime && (
                        <div className="bg-muted p-4 rounded-md space-y-2">
                            <h3 className="font-semibold mb-2">Session Summary</h3>
                            <div className="text-sm space-y-1">
                                <p>
                                    <span className="text-muted-foreground">Date:</span>{' '}
                                    <span className="font-semibold">{format(selectedDate, 'MMMM dd, yyyy')}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Time:</span>{' '}
                                    <span className="font-semibold">
                                        {selectedTime} - {calculateEndTime(selectedTime, duration)}
                                    </span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Duration:</span>{' '}
                                    <span className="font-semibold">{duration} minutes</span>
                                </p>
                                <div className="pt-2 border-t border-border mt-2">
                                    <p className="text-lg">
                                        <span className="text-muted-foreground">Total Price:</span>{' '}
                                        <span className="font-bold text-primary">${calculatePrice()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <h3 className="font-semibold mb-3">Additional Notes (Optional)</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Topics to cover, specific questions, etc..."
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
                            {loading ? 'Processing...' : `Book Session - $${calculatePrice()}`}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
