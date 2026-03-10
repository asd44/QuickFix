'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { BookingService } from '@/lib/services/booking.service';
import { Booking } from '@/lib/types/database';
import Link from 'next/link';

export default function TutorDashboard() {
    const { user, userData } = useAuth();
    const [bookings, setBookings] = useState<(Booking & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && userData?.role === 'tutor') {
            // Subscribe to Bookings (Real-time)
            const unsubscribe = BookingService.listenToTutorBookings(user.uid, (bookingsData) => {
                setBookings(bookingsData);
                setLoading(false);
            });

            return () => {
                unsubscribe();
            };
        }
    }, [user, userData]);

    if (!user || !userData?.tutorProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a service provider to access this page</p>
            </div>
        );
    }

    const profile = userData.tutorProfile;
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const newRequests = bookings.filter(b => b.status === 'pending').length;

    const stats = [
        {
            label: 'Average Rating',
            value: profile.averageRating ? profile.averageRating.toFixed(1) : '0.0',
            subtext: `${profile.totalRatings || 0} reviews`
        },
        {
            label: 'Total Reviews',
            value: profile.totalRatings || 0
        },
        {
            label: 'New Requests',
            value: newRequests
        },
        {
            label: 'Completed Bookings',
            value: completedBookings.length
        },
    ];

    return (
        <div className="space-y-8 container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold">Welcome, {profile.firstName}!</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">{stat.value}</span>
                                {stat.subtext && (
                                    <span className="text-xs text-muted-foreground">{stat.subtext}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Verification Status */}
            {!profile.verified && (
                <Card className="border-yellow-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-1">📋 Verification Required</h3>
                                <p className="text-sm text-muted-foreground">
                                    Upload documents to get verified and increase your visibility
                                </p>
                            </div>
                            <Link href="/tutor/kyc">
                                <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
                                    Upload Documents
                                </button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Subscription Status */}
            {profile.subscription.status !== 'active' && (
                <Card className="border-yellow-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-1">⚠️ Subscription Required</h3>
                                <p className="text-sm text-muted-foreground">
                                    Subscribe to appear in search results and receive customer leads
                                </p>
                                {!profile.verified && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                        ⚠️ You must be verified before subscribing. Upload verification documents first.
                                    </p>
                                )}
                            </div>
                            {profile.verified ? (
                                <Link href="/tutor/profile/subscription">
                                    <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
                                        Subscribe Now
                                    </button>
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="bg-gray-400 text-gray-200 px-6 py-2 rounded-md cursor-not-allowed opacity-60"
                                    title="Complete verification first"
                                >
                                    Subscribe Now
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
