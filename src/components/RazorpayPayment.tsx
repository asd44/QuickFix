'use client';

import { useState } from 'react';
import { Button } from './Button';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayPaymentProps {
    amount: number;
    bookingId: string;
    isFinalPayment?: boolean;
    onSuccess: () => void;
    onFailure: (error: string) => void;
}

export function RazorpayPayment({
    amount,
    bookingId,
    isFinalPayment = false,
    onSuccess,
    onFailure,
}: RazorpayPaymentProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Load Razorpay script dynamically
            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                document.body.appendChild(script);

                await new Promise<void>((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Razorpay'));
                });
            }

            // Client-side Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: amount * 100, // Convert to paise
                currency: 'INR',
                name: 'QuickFix',
                description: isFinalPayment ? 'Final Service Payment' : 'Booking Payment',
                image: '/icon-192.png',
                handler: async function (response: any) {
                    try {
                        // Update booking in Firestore
                        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase/config');

                        const bookingRef = doc(db, 'bookings', bookingId);

                        if (isFinalPayment) {
                            await updateDoc(bookingRef, {
                                finalPaymentId: response.razorpay_payment_id,
                                finalPaymentStatus: 'completed',
                                paidAt: Timestamp.now(),
                                updatedAt: Timestamp.now(),
                            });
                        } else {
                            await updateDoc(bookingRef, {
                                paymentStatus: 'paid',
                                status: 'confirmed',
                                paymentIntentId: response.razorpay_payment_id,
                                updatedAt: Timestamp.now(),
                            });
                        }

                        setLoading(false);
                        onSuccess();
                    } catch (error) {
                        console.error('Error updating booking:', error);
                        setLoading(false);
                        onFailure('Payment successful but failed to update booking');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    phone: '',
                },
                notes: {
                    bookingId,
                },
                theme: {
                    color: '#FF5722',
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        onFailure('Payment cancelled');
                    },
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response: any) {
                setLoading(false);
                onFailure(response.error.description || 'Payment failed');
            });

            paymentObject.open();
        } catch (error: any) {
            console.error('Payment error:', error);
            setLoading(false);
            onFailure(error.message || 'Payment failed');
        }
    };

    return (
        <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
        >
            {loading ? 'Processing...' : `Pay ₹${amount}`}
        </Button>
    );
}
