'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { User } from '@/lib/types/database';
import { AdminService } from '@/lib/services/admin.service';
import { SubscriptionService } from '@/lib/services/subscription.service';

export default function AdminSubscriptionsPage() {
    const { user, userData } = useAuth();
    const [tutors, setTutors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTutor, setSelectedTutor] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user && userData?.role === 'admin') {
            loadTutors();
        } else if (user && userData?.role !== 'admin') {
            setError('Admin access required');
            setLoading(false);
        }
    }, [user, userData]);

    const loadTutors = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching tutors...');
            const allTutors = await AdminService.getAllUsers('tutor');

            // Filter to only show verified tutors
            const verifiedTutors = allTutors.filter(tutor => tutor.tutorProfile?.verified === true);

            console.log('Tutors fetched:', allTutors.length, 'Verified:', verifiedTutors.length);
            setTutors(verifiedTutors);

            if (verifiedTutors.length === 0) {
                setError('No verified service providers found. Providers must be verified before managing subscriptions.');
            }
        } catch (error: any) {
            console.error('Failed to load tutors:', error);
            setError(`Error loading tutors: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantSubscription = async (tutorId: string, plan: 'monthly' | 'quarterly' | 'yearly') => {
        setActionLoading(true);
        try {
            await SubscriptionService.grantSubscription(tutorId, plan);
            await loadTutors();
            alert(`${plan} subscription granted successfully!`);
        } catch (error) {
            console.error('Failed to grant subscription:', error);
            alert('Failed to grant subscription');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisableSubscription = async (tutorId: string) => {
        if (!confirm('Are you sure you want to disable this subscription?')) return;

        setActionLoading(true);
        try {
            await SubscriptionService.disableSubscription(tutorId);
            await loadTutors();
            alert('Subscription disabled successfully!');
        } catch (error) {
            console.error('Failed to disable subscription:', error);
            alert('Failed to disable subscription');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEnableSubscription = async (tutorId: string, days: number = 30) => {
        setActionLoading(true);
        try {
            await SubscriptionService.enableSubscription(tutorId, days);
            await loadTutors();
            alert(`Subscription enabled for ${days} days!`);
        } catch (error) {
            console.error('Failed to enable subscription:', error);
            alert('Failed to enable subscription');
        } finally {
            setActionLoading(false);
        }
    };

    if (!user || userData?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Access denied. Admin only.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
                <p className="text-muted-foreground">Grant, enable, or disable subscriptions for verified service providers</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                    <p className="text-sm text-yellow-700 dark:text-yellow-500">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Check browser console (F12) for more details
                    </p>
                </div>
            )}

            <div className="grid gap-6">
                {tutors.map((tutor) => {
                    const subscription = tutor.tutorProfile?.subscription;
                    const isActive = subscription?.status === 'active';
                    const endDate = subscription?.endDate?.toDate();
                    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

                    return (
                        <Card key={tutor.uid}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">
                                                {tutor.tutorProfile?.firstName} {tutor.tutorProfile?.lastName}
                                            </h3>
                                            {isActive ? (
                                                <Badge className="bg-green-500">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                            {subscription?.plan && (
                                                <Badge variant="outline">{subscription.plan}</Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-1">
                                            {tutor.email}
                                        </p>

                                        {isActive && endDate && (
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Expires in: </span>
                                                <span className={daysRemaining < 7 ? 'text-red-500 font-semibold' : 'font-semibold'}>
                                                    {daysRemaining} days
                                                </span>
                                                <span className="text-muted-foreground ml-2">
                                                    ({endDate.toLocaleDateString()})
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {isActive ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEnableSubscription(tutor.uid, 30)}
                                                    disabled={actionLoading}
                                                >
                                                    + 30 Days
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDisableSubscription(tutor.uid)}
                                                    disabled={actionLoading}
                                                >
                                                    Disable
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleGrantSubscription(tutor.uid, 'monthly')}
                                                    disabled={actionLoading}
                                                >
                                                    Monthly
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleGrantSubscription(tutor.uid, 'quarterly')}
                                                    disabled={actionLoading}
                                                >
                                                    Quarterly
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleGrantSubscription(tutor.uid, 'yearly')}
                                                    disabled={actionLoading}
                                                >
                                                    Yearly
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {tutors.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <p className="text-lg font-semibold mb-2">No Verified Service Providers Found</p>
                        <p className="text-muted-foreground mb-4">
                            Only verified service providers can have subscriptions. Verify providers first.
                        </p>
                        <div className="flex flex-col gap-2 text-sm text-left bg-muted p-4 rounded-md">
                            <p className="font-semibold">Steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Go to <code className="bg-background px-1 rounded">/en/admin</code> dashboard</li>
                                <li>Check "Verification Queue" for pending providers</li>
                                <li>Review and approve provider documents</li>
                                <li>Return here to manage subscriptions</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
