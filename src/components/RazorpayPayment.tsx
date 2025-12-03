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
    isFinalPayment?: boolean;  // True for final payment after job completion
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

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Load Razorpay script
            const res = await loadRazorpayScript();
            if (!res) {
                onFailure('Failed to load payment gateway');
                setLoading(false);
                return;
            }

            // Create order
            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    bookingId,
                    receipt: `booking_${bookingId}`,
                }),
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to create order');
            }

            const order = await orderResponse.json();

            // Razorpay checkout options
            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: 'QuickFix',
                description: 'Service Job Payment',
                order_id: order.orderId,
                handler: async function (response: any) {
                    // Verify payment
                    const verifyResponse = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.verified) {
                        // Update booking status in Firestore (client-side)
                        try {
                            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                            const { db } = await import('@/lib/firebase/config');

                            if (isFinalPayment) {
                                // Update final payment fields
                                await updateDoc(doc(db, 'bookings', bookingId), {
                                    finalPaymentId: response.razorpay_payment_id,
                                    finalPaymentStatus: 'completed',
                                    paidAt: serverTimestamp(),
                                    updatedAt: serverTimestamp(),
                                });
                            } else {
                                // Update initial booking payment fields
                                await updateDoc(doc(db, 'bookings', bookingId), {
                                    paymentStatus: 'paid',
                                    status: 'confirmed',
                                    paymentIntentId: response.razorpay_payment_id,
                                    updatedAt: serverTimestamp(),
                                });
                            }

                            console.log('Booking updated successfully');
                        } catch (updateError) {
                            console.error('Failed to update booking:', updateError);
                        }

                        onSuccess();
                    } else {
                        onFailure('Payment verification failed');
                    }
                    setLoading(false);
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
                    color: '#3B82F6',
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        onFailure('Payment cancelled');
                    },
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error: any) {
            console.error('Payment error:', error);
            onFailure(error.message || 'Payment failed');
            setLoading(false);
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
