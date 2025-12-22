'use client';

import { useEffect, useState, Suspense } from 'react';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { User, Booking } from '@/lib/types/database';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { TutorService } from '@/lib/services/tutor.service';

function ProviderAnalyticsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [provider, setProvider] = useState<User | null>(null);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalBookings: 0,
        completedBookings: 0,
        averageRating: 0,
    });
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [isSuspended, setIsSuspended] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Provider Details
                const userData = await FirestoreREST.getDoc<User>('users', id);
                if (userData) {
                    setProvider({ ...userData, uid: id });
                    setIsSuspended(userData.tutorProfile?.isSuspended ?? false);
                }

                // 2. Fetch Bookings for Stats
                const bookings = await FirestoreREST.query<Booking & { id: string }>('bookings', {
                    where: [{ field: 'tutorId', op: 'EQUAL', value: id }]
                });

                let earnings = 0;
                let completed = 0;

                bookings.forEach(booking => {
                    if (booking.status === 'completed') {
                        completed++;
                        earnings += ((booking as any).finalBillAmount || booking.totalPrice || 0);
                    }
                });

                setStats({
                    totalBookings: bookings.length,
                    completedBookings: completed,
                    totalEarnings: earnings,
                    averageRating: userData?.tutorProfile?.averageRating || 0
                });

            } catch (error) {
                console.error("Error fetching provider data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);



    const handleToggleStatus = async () => {
        if (!provider?.uid) return;
        try {
            setStatusUpdating(true);
            const newSuspendedState = !isSuspended;
            await TutorService.toggleSuspensionStatus(provider.uid, newSuspendedState);
            setIsSuspended(newSuspendedState);
        } catch (error) {
            console.error('Failed to toggle status:', error);
        } finally {
            setStatusUpdating(false);
        }
    };

    if (!id) return <div className="min-h-screen flex items-center justify-center bg-gray-50">No Provider ID specified</div>;
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    if (!provider) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Provider not found</div>;

    const kyc = provider.tutorProfile?.kyc;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="bg-[#0f172a] text-white shadow-md sticky top-0 z-30">
                <div className="px-6 py-4 flex items-center gap-4">
                    <Link href="/admin/providers" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold">Provider Analytics</h1>
                </div>
            </header>

            <main className="p-6 max-w-7xl mx-auto space-y-8">
                {/* 1. Analytics Overview Cards */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-white border-blue-100 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Earnings</p>
                            <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-green-100 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 mb-1">Bookings Completed</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.completedBookings} <span className="text-sm text-gray-400 font-normal">/ {stats.totalBookings}</span></p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-yellow-100 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 mb-1">Average Rating</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-purple-100 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                            {provider.tutorProfile?.verified ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Verified</Badge>
                            ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending Verification</Badge>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-gray-500">Account Status</span>
                                    <span className="relative flex h-2 w-2">
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    </span>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleToggleStatus}
                                    isLoading={statusUpdating}
                                    className={`w-full flex items-center justify-center gap-2 ${!isSuspended ? "bg-red-600 text-white hover:bg-red-700 shadow-sm" : "bg-green-600 hover:bg-green-700 shadow-sm"}`}
                                >
                                    {!isSuspended ? (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            Deactivate Profile
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Activate Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Provider Details (Main Column) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-0">
                                <CardTitle>Profile Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                                        <p className="font-medium text-lg text-gray-900">
                                            {provider.tutorProfile
                                                ? `${provider.tutorProfile.firstName} ${provider.tutorProfile.lastName}`
                                                : provider.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 mb-1 block">Phone Number</label>
                                        <p className="font-medium text-gray-900">{provider.phoneNumber || "Not provided"}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 mb-1 block">Category / Services</label>
                                        <p className="font-medium text-gray-900">
                                            {provider.tutorProfile?.subjects?.length
                                                ? provider.tutorProfile.subjects.join(', ')
                                                : "No services listed"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 mb-1 block">Location</label>
                                        <p className="font-medium text-gray-900">
                                            {[
                                                provider.tutorProfile?.address,
                                                provider.tutorProfile?.area,
                                                provider.tutorProfile?.city
                                            ].filter(Boolean).join(', ') || "No location provided"}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Bio / Description</label>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {provider.tutorProfile?.bio || 'No bio provided'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. KYC Documents (Side Column) */}
                    <div className="space-y-6">
                        <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-0">
                                <CardTitle>KYC Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {kyc ? (
                                    <>
                                        <div>
                                            <label className="text-sm text-gray-600 mb-1 block">Live Photo</label>
                                            {kyc.photoUrl ? (
                                                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                                                    <img src={kyc.photoUrl} alt="Live Photo" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                                                </div>
                                            ) : (
                                                <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                    No Photo
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 mb-1 block">ID Document</label>
                                            {kyc.idProofUrl ? (
                                                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 overflow-y-auto">
                                                    {kyc.idProofUrl.toLowerCase().includes('.pdf') ? (
                                                        <iframe src={kyc.idProofUrl} className="w-full h-full pointer-events-none" />
                                                    ) : (
                                                        <img src={kyc.idProofUrl} alt="ID Proof" className="object-cover w-full h-full" />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                    No ID
                                                </div>
                                            )}
                                            {kyc.idProofUrl && (
                                                <a href={kyc.idProofUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-blue-600 hover:underline text-right">
                                                    View Original File &rarr;
                                                </a>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 mb-1 block">ID Number</label>
                                            <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                                                {kyc.idNumber || "Not recorded"}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No KYC documents submitted.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ProviderAnalyticsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
            <ProviderAnalyticsContent />
        </Suspense>
    );
}
