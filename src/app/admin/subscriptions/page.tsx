'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { Card, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { User } from '@/lib/types/database';
import { AdminService } from '@/lib/services/admin.service';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { format, isValid, addDays, differenceInDays } from 'date-fns';

// Helper to safely convert timestamp to Date
const toDateSafe = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    try {
        if (timestamp instanceof Date) return timestamp;
        if (timestamp.toDate) return timestamp.toDate();
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        const d = new Date(timestamp);
        return isValid(d) ? d : null;
    } catch (e) {
        return null;
    }
};

export default function AdminSubscriptionsPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const [tutors, setTutors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Store ID of processing item
    const [repairing, setRepairing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fixAdminRole = async () => {
        if (!user || user.email !== 'admin@quickfix.in') return;
        setRepairing(true);
        try {
            await FirestoreREST.updateDoc('users', user.uid, { role: 'admin' });
            alert('Admin privileges restored! Reloading...');
            window.location.reload();
        } catch (err: any) {
            alert('Failed to restore admin role: ' + err.message);
            setRepairing(false);
        }
    };

    const loadTutors = async () => {
        setLoading(true);
        setError('');
        try {
            const allTutors = await AdminService.getAllUsers('tutor');
            // Filter to only show verified tutors
            const verifiedTutors = allTutors.filter(tutor => tutor.tutorProfile?.verified === true);
            setTutors(verifiedTutors);
            if (verifiedTutors.length === 0) {
                setError('No verified service providers found.');
            }
        } catch (error: any) {
            console.error('Failed to load tutors:', error);
            setError(`Error loading tutors: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantSubscription = async (tutorId: string, plan: 'monthly' | 'quarterly' | 'yearly') => {
        setActionLoading(tutorId);
        try {
            await SubscriptionService.grantSubscription(tutorId, plan);
            await loadTutors();
        } catch (error) {
            console.error('Failed to grant subscription:', error);
            alert('Failed to grant subscription');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDisableSubscription = async (tutorId: string) => {
        if (!confirm('Are you sure you want to disable this subscription?')) return;
        setActionLoading(tutorId);
        try {
            await SubscriptionService.disableSubscription(tutorId);
            await loadTutors();
        } catch (error) {
            console.error('Failed to disable subscription:', error);
            alert('Failed to disable subscription');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEnableSubscription = async (tutorId: string, days: number = 30) => {
        setActionLoading(tutorId);
        try {
            await SubscriptionService.enableSubscription(tutorId, days);
            await loadTutors();
        } catch (error) {
            console.error('Failed to enable subscription:', error);
            alert('Failed to enable subscription');
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (user && !userData) return;

        if (user && userData?.role === 'admin') {
            loadTutors();
        } else if (user && userData?.role !== 'admin') {
            setError('Admin access required');
            setLoading(false);
        } else if (!user) {
            setLoading(false);
        }
    }, [user, userData, authLoading]);

    // Derived state for searching and stats
    const filteredTutors = useMemo(() => {
        return tutors.filter(t => {
            const name = `${t.tutorProfile?.firstName || ''} ${t.tutorProfile?.lastName || ''}`.toLowerCase();
            const email = (t.email || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            return name.includes(search) || email.includes(search);
        });
    }, [tutors, searchTerm]);

    const stats = useMemo(() => {
        let active = 0;
        let expiringSoon = 0;
        let inactive = 0;

        tutors.forEach(t => {
            const sub = t.tutorProfile?.subscription;
            if (sub?.status === 'active') {
                active++;
                const end = toDateSafe(sub.endDate);
                if (end && differenceInDays(end, new Date()) <= 7) {
                    expiringSoon++;
                }
            } else {
                inactive++;
            }
        });
        return { active, expiringSoon, inactive };
    }, [tutors]);


    if (authLoading || (loading && !error && tutors.length === 0)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#005461] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || userData?.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md shadow-lg border-red-100">
                    <CardContent className="space-y-6 pt-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🚫</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
                            <p className="text-muted-foreground mt-2">Admin privileges required.</p>
                        </div>

                        <div className="bg-slate-100 p-4 rounded-lg text-xs font-mono space-y-2 break-all">
                            <p><strong>ID:</strong> {user?.uid || 'Not Logged In'}</p>
                            <p><strong>Role:</strong> {userData?.role || 'None'}</p>
                        </div>

                        {user?.email === 'admin@quickfix.in' && (
                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={fixAdminRole} disabled={repairing}>
                                {repairing ? 'Restoring...' : 'Restore Admin Privileges'}
                            </Button>
                        )}
                        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/admin'}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
                            <p className="text-gray-500 text-sm mt-1">Manage plans and validity for verified providers</p>
                        </div>

                        <div className="flex gap-3">
                            {/* Stats Pills */}
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <div className="px-3 py-1 bg-white rounded-md shadow-sm border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase font-bold mr-2">Active</span>
                                    <span className="text-sm font-bold text-green-600">{stats.active}</span>
                                </div>
                                <div className="px-3 py-1 bg-white rounded-md shadow-sm border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase font-bold mr-2">Expiring</span>
                                    <span className="text-sm font-bold text-orange-600">{stats.expiringSoon}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-6">
                        <div className="relative max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Search providers..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005461]/20 focus:border-[#005461] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {filteredTutors.map((tutor) => {
                        const subscription = tutor.tutorProfile?.subscription;
                        const isActive = subscription?.status === 'active';
                        const endDate = toDateSafe(subscription?.endDate);
                        const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : 0;
                        const isProcessing = actionLoading === tutor.uid;

                        return (
                            <div
                                key={tutor.uid}
                                className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'}`}
                            >
                                <div className="p-5 flex flex-col md:flex-row gap-6">
                                    {/* User Info */}
                                    <div className="flex-1 flex gap-4">
                                        {/* Avatar Placeholder */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 ${isActive ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-400'}`}>
                                            {tutor.tutorProfile?.firstName?.[0] || 'U'}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#005461] transition-colors">
                                                    {tutor.tutorProfile?.firstName} {tutor.tutorProfile?.lastName}
                                                </h3>
                                                {subscription?.plan && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200 bg-gray-50 text-gray-600">
                                                        {subscription.plan}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono mt-0.5">{tutor.email}</p>

                                            {/* Status Text for Mobile */}
                                            <div className="md:hidden mt-2">
                                                {isActive ? (
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Inactive</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expiry & Status */}
                                    <div className="flex-1 flex flex-col justify-center min-w-[200px]">
                                        {isActive && endDate ? (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Subscription Expires</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-2xl font-bold ${daysRemaining < 7 ? 'text-orange-500' : 'text-gray-900'}`}>
                                                        {daysRemaining} <span className="text-sm font-normal text-gray-500">days</span>
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        ({format(endDate, 'MMM dd, yyyy')})
                                                    </span>
                                                </div>
                                                {daysRemaining < 0 && (
                                                    <span className="text-xs text-red-600 font-medium">Expired {Math.abs(daysRemaining)} days ago</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                <span className="text-sm font-medium">No active subscription</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 min-w-[280px] justify-end">
                                        {isProcessing ? (
                                            <div className="flex items-center gap-2 text-sm text-[#005461]">
                                                <div className="w-4 h-4 border-2 border-[#005461] border-t-transparent rounded-full animate-spin"></div>
                                                Updating...
                                            </div>
                                        ) : isActive ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 hover:bg-[#005461] hover:text-white border-gray-200 transition-colors"
                                                    onClick={() => handleEnableSubscription(tutor.uid, 30)}
                                                >
                                                    + 30 Days
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => handleDisableSubscription(tutor.uid)}
                                                >
                                                    Disable
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                                                    onClick={() => handleGrantSubscription(tutor.uid, 'monthly')}
                                                >
                                                    Monthly
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                                                    onClick={() => handleGrantSubscription(tutor.uid, 'quarterly')}
                                                >
                                                    Quarterly
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-[#005461] text-white hover:bg-[#00424d] shadow-md"
                                                    onClick={() => handleGrantSubscription(tutor.uid, 'yearly')}
                                                >
                                                    Yearly
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar Background for Active */}
                                {isActive && endDate && daysRemaining > 0 && daysRemaining < 365 && (
                                    <div className="h-1 bg-gray-100 w-full mt-0">
                                        <div
                                            className={`h-full ${daysRemaining < 7 ? 'bg-orange-500' : 'bg-[#005461]'}`}
                                            style={{ width: `${Math.min(100, Math.max(0, (daysRemaining / 30) * 100))}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredTutors.length === 0 && !loading && (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-400 mb-2 text-4xl">🔍</p>
                            <h3 className="text-lg font-semibold text-gray-900">No Providers Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-1">
                                {searchTerm ? `No results for "${searchTerm}"` : 'Verify providers in the dashboard to manage their subscriptions.'}
                            </p>
                            {searchTerm && (
                                <Button variant="ghost" onClick={() => setSearchTerm('')} className="mt-2 text-[#005461] hover:bg-[#005461]/10">
                                    Clear search
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
