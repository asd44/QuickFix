'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { InterestedStudentService } from '@/lib/services/interested-student.service';
import { BookingService } from '@/lib/services/booking.service';
import { InterestedStudent, Booking } from '@/lib/types/database';
import Link from 'next/link';

export default function TutorDashboard() {
    const { user, userData } = useAuth();
    const [interestedStudents, setInterestedStudents] = useState<InterestedStudent[]>([]);
    const [bookings, setBookings] = useState<(Booking & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && userData?.role === 'tutor') {
            Promise.all([
                InterestedStudentService.getInterestedStudents(user.uid),
                BookingService.getTutorBookings(user.uid)
            ]).then(([students, bookingsData]) => {
                // Deduplicate by studentId - keep only the most recent interaction
                const uniqueStudents = students.reduce((acc, current) => {
                    const existing = acc.find(s => s.studentId === current.studentId);
                    if (!existing) {
                        acc.push(current);
                    } else if (current.timestamp.toDate() > existing.timestamp.toDate()) {
                        // Replace with more recent interaction
                        const index = acc.findIndex(s => s.studentId === current.studentId);
                        acc[index] = current;
                    }
                    return acc;
                }, [] as InterestedStudent[]);

                setInterestedStudents(uniqueStudents);
                setBookings(bookingsData);
                setLoading(false);
            });
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

    // Calculate unique customers from completed bookings
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const uniqueCustomers = new Set(completedBookings.map(b => b.studentId)).size;

    const stats = [
        {
            label: 'Profile Views',
            value: profile.profileViews || 0
        },
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
            label: 'Unique Customers',
            value: uniqueCustomers
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
            <div className="grid md:grid-cols-5 gap-6">
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
                            <Link href="/tutor/verification">
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
                                <Link href="/tutor/subscription">
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

            {/* Interested Customers (Leads) */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Interested Customers</h2>
                        <p className="text-sm text-muted-foreground">Customers who viewed your profile or saw you in search results</p>
                    </div>
                    <Badge variant="secondary">{interestedStudents.length} Leads</Badge>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : interestedStudents.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No interested customers yet. Make sure your profile is complete and your subscription is active!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {interestedStudents.map((student) => (
                            <Card key={student.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{student.studentInfo.firstName}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{student.studentInfo.grade}</p>
                                        </div>
                                        <Badge variant="outline">
                                            {student.action === 'profile_view' ? '👁️ Viewed' : '🔍 Search'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <span>📍 {student.studentInfo.city}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {student.timestamp?.toDate().toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
