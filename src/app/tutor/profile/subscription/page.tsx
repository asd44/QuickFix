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
            const { TutorService } = await import('@/lib/services/tutor.service');
            await TutorService.activateSubscriptionTrial(userData.uid);

            // Force reload to update UI
            window.location.reload();
        } catch (error: any) {
            console.error("Error activating trial:", error);
            alert(error.message || "Failed to activate trial. Please try again.");
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        try {
            // Handle Firestore Timestamp
            if (date.seconds) {
                return new Date(date.seconds * 1000).toLocaleDateString();
            }
            // Handle ISO string
            if (typeof date === 'string') {
                return new Date(date).toLocaleDateString();
            }
            return 'N/A';
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Header */}
            <div className="bg-[#5A0E24] pt-12 pb-8 px-4 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-[#771532] to-transparent opacity-50 pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4 text-white">
                    <Link href="/tutor/profile">
                        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all backdrop-blur-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold">My Subscription</h1>
                </div>
            </div>

            <div className="p-6 -mt-6 relative z-20 space-y-6">
                {hasActiveSubscription ? (
                    <Card className="bg-white border-none shadow-xl rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1"></div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl text-gray-800 font-bold">
                                        {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Premium'} Plan
                                    </CardTitle>
                                    <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Active Subscription
                                    </p>
                                </div>
                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                                    ACTIVE
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                                    <p className="font-semibold text-gray-800">
                                        {formatDate(subscription?.startDate)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">End Date</p>
                                    <p className="font-semibold text-gray-800">
                                        {formatDate(subscription?.endDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    Your subscription will auto-renew on <span className="font-semibold">{formatDate(subscription?.endDate)}</span>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {/* No Active Subscription Card */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                                    <span className="text-4xl">💎</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Subscription</h3>
                                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto mb-8">
                                    You are currently on the free plan. Upgrade to unlock premium features and get more leads.
                                </p>

                                {userData.tutorProfile?.verified ? (
                                    <Button
                                        onClick={handleStartTrial}
                                        className="w-full bg-gradient-to-r from-[#FF4B1F] to-[#FF9068] hover:shadow-lg hover:shadow-orange-500/30 text-white font-bold py-4 rounded-xl transition-all transform hover:-translate-y-1"
                                    >
                                        Start 30-Day Free Trial
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                                            <p className="font-bold flex items-center gap-2 mb-1">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Verification Required
                                            </p>
                                            <p>You must complete your KYC verification before you can start your free trial.</p>
                                        </div>
                                        <Link href="/tutor/kyc">
                                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl">
                                                Complete Verification
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Available Plans Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Available Plans</h3>
                            <div className="space-y-4">
                                {['Monthly', 'Quarterly', 'Yearly'].map((plan) => (
                                    <div key={plan} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-xl shadow-inner">
                                                {plan === 'Monthly' ? '📅' : plan === 'Quarterly' ? '🍂' : '👑'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-lg">{plan} Plan</h4>
                                                <p className="text-xs text-gray-500">Unlimited leads & priority support</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                                            View Details
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
