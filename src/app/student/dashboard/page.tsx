'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import Link from 'next/link';

export default function StudentDashboard() {
    const { user, userData } = useAuth();

    if (!user || !userData?.studentProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a customer to access this page</p>
            </div>
        );
    }

    const profile = userData.studentProfile;

    // Mock stats (would be fetched from Firestore in production)
    const stats = [
        { label: 'Total Booked Services', value: 12, description: 'Completed bookings' },
        { label: 'Active Services', value: 3, description: 'In progress' },
        { label: 'Favorite Providers', value: profile.favorites?.length || 0, description: 'Saved for later' },
    ];

    return (
        <div className="space-y-8 container mx-auto px-4 py-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {userData?.studentProfile?.firstName}!</h1>
                <p className="text-muted-foreground">Manage your service bookings</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <Link href="/search">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <h3 className="font-semibold mb-1">Find Services</h3>
                                    <p className="text-sm text-muted-foreground mb-3">Browse service providers</p>
                                </div>
                                <span className="text-3xl">🔍</span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/student/messages">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <h3 className="font-semibold mb-1">Messages</h3>
                                    <p className="text-sm text-muted-foreground mb-3">Chat with providers</p>
                                </div>
                                <span className="text-3xl">💬</span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/student/favorites">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <h3 className="font-semibold mb-1">Favorites</h3>
                                    <p className="text-sm text-muted-foreground mb-3">Your saved providers</p>
                                </div>
                                <span className="text-3xl">⭐</span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Recent Activity */}
            <section>
                <h2 className="text-xl font-bold mb-4">Upcoming Services</h2>
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        No upcoming services. <Link href="/search" className="text-primary hover:underline">Find a service provider</Link> to book your first service!
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
