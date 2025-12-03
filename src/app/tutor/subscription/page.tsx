'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { Subscription } from '@/lib/types/database';

export default function TutorSubscriptionPage() {
    const { user, userData } = useAuth();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && userData?.role === 'tutor') {
            loadSubscriptions();
        }
    }, [user, userData]);

    const loadSubscriptions = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const subs = await SubscriptionService.getTutorSubscriptions(user.uid);
            setSubscriptions(subs);
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user || !userData?.tutorProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a service provider to access this page</p>
            </div>
        );
    }

    const currentSubscription = userData.tutorProfile.subscription;
    const isActive = currentSubscription?.status === 'active';
    const endDate = currentSubscription?.endDate?.toDate();
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Subscription</h1>

            {/* Current Status */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {isActive ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-green-500 text-white">Active</Badge>
                                <Badge variant="outline" className="capitalize">{currentSubscription.plan}</Badge>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Plan:</span>
                                    <span className="font-semibold ml-2 capitalize">{currentSubscription.plan}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-muted-foreground">Expires:</span>
                                    <span className={`font-semibold ml-2 ${daysRemaining < 7 ? 'text-red-500' : ''}`}>
                                        {endDate?.toLocaleDateString()} ({daysRemaining} days remaining)
                                    </span>
                                </p>
                            </div>

                            {daysRemaining < 7 && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-500">
                                        ⚠️ Your subscription is expiring soon! Contact admin to renew.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-border">
                                <h4 className="font-semibold mb-2">Benefits:</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>✓ Appear in search results</li>
                                    <li>✓ Receive customer messages</li>
                                    <li>✓ View interested customers</li>
                                    <li>✓ Verified badge on profile</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Badge variant="secondary" className="mb-4">Inactive</Badge>
                            <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                            <p className="text-muted-foreground mb-4">
                                Contact admin to activate your subscription and start receiving customers
                            </p>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>📧 Email: admin@quickfix.com</p>
                                <p>💬 Or message through the platform</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Subscription History */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No subscription history</p>
                    ) : (
                        <div className="space-y-4">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between p-4 border border-border rounded-md">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="capitalize">{sub.plan}</Badge>
                                            <Badge className={sub.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                                {sub.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {sub.startDate?.toDate().toLocaleDateString()} - {sub.endDate?.toDate().toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {sub.amount === 0 ? 'Free' : `$${sub.amount}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {sub.paymentMethod?.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
