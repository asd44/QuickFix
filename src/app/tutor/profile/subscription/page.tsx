'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';

export default function SubscriptionPage() {
    const { userData } = useAuth();

    if (!userData) return null;

    const subscription = userData.tutorProfile?.subscription;
    const hasActiveSubscription = subscription?.status === 'active';

    const handleStartTrial = async () => {
        if (!userData) return;
        try {
            const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase/config');

            const startDate = Timestamp.now();
            const endDate = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial

            await updateDoc(doc(db, 'users', userData.uid), {
                'tutorProfile.subscription': {
                    plan: 'monthly',
                    status: 'active',
                    startDate: startDate,
                    endDate: endDate
                }
            });

            // Force reload to update UI
            window.location.reload();
        } catch (error) {
            console.error("Error activating trial:", error);
            alert("Failed to activate trial. Please try again.");
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-4 sticky top-0 bg-white z-10">
                <Link href="/tutor/profile">
                    <span className="text-2xl">←</span>
                </Link>
                <h1 className="text-xl font-bold">My Subscription</h1>
            </div>

            <div className="p-6">
                {hasActiveSubscription ? (
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl text-blue-900">
                                        {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Premium'} Plan
                                    </CardTitle>
                                    <p className="text-sm text-blue-600 mt-1">Active Subscription</p>
                                </div>
                                <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white/50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Start Date</span>
                                    <span className="font-medium">
                                        {subscription?.startDate ? new Date(subscription.startDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">End Date</span>
                                    <span className="font-medium">
                                        {subscription?.endDate ? new Date(subscription.endDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status</span>
                                    <span className="font-medium capitalize text-green-600">{subscription?.status}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs text-blue-600 text-center">
                                    Your subscription will auto-renew on {subscription?.endDate ? new Date(subscription.endDate.seconds * 1000).toLocaleDateString() : 'expiry date'}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="pt-6 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                                    💎
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">No Active Subscription</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You are currently on the free plan. Upgrade to unlock premium features and get more leads.
                                    </p>
                                </div>
                                <Button onClick={handleStartTrial} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3">
                                    Start 30-Day Free Trial
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4">
                            <h3 className="font-semibold text-lg">Available Plans</h3>

                            {/* Mock Plans */}
                            {['Monthly', 'Quarterly', 'Yearly'].map((plan) => (
                                <Card key={plan} className="relative overflow-hidden">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold">{plan} Plan</h4>
                                            <p className="text-sm text-muted-foreground">Unlimited leads & priority support</p>
                                        </div>
                                        <Button variant="outline" size="sm">View Details</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
