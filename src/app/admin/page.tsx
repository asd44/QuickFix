'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import Link from 'next/link';
import { User, Booking, Complaint as ComplaintType } from '@/lib/types/database';

interface VerificationRequest {
    id: string;
    name: string;
    email: string;
    submittedAt: string;
    status: string;
}

interface Complaint {
    id: string;
    subject: string;
    status: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        pendingVerifications: 0,
        totalProviders: 0,
        totalCustomers: 0,
        totalEarnings: 0,
        pendingComplaints: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel using FirestoreREST
                const [
                    allTutors,
                    providers,
                    customers,
                    completedBookings,
                    pendingComplaintsData
                ] = await Promise.all([
                    // Get all tutors and filter for pending verification client-side
                    FirestoreREST.query<User & { id: string }>('users', {
                        where: [{ field: 'role', op: 'EQUAL', value: 'tutor' }]
                    }),
                    FirestoreREST.query<User & { id: string }>('users', {
                        where: [{ field: 'role', op: 'EQUAL', value: 'tutor' }]
                    }),
                    FirestoreREST.query<User & { id: string }>('users', {
                        where: [{ field: 'role', op: 'EQUAL', value: 'student' }]
                    }),
                    FirestoreREST.query<Booking & { id: string }>('bookings', {
                        where: [{ field: 'status', op: 'EQUAL', value: 'completed' }]
                    }),
                    FirestoreREST.query<ComplaintType & { id: string }>('complaints', {
                        where: [{ field: 'status', op: 'EQUAL', value: 'pending' }]
                    })
                ]);

                // Filter tutors who need verification (not verified yet)
                const pendingKycUsers = allTutors.filter(user => {
                    const isNotVerified = !user.tutorProfile?.verified;
                    const hasDocuments = user.tutorProfile?.verificationDocuments &&
                        user.tutorProfile.verificationDocuments.length > 0;
                    const kycPending = user.tutorProfile?.kyc?.status === 'pending';

                    // Show in verification queue if: not verified
                    // (prioritize those with documents or pending KYC)
                    return isNotVerified;
                });

                console.log('[AdminDashboard] All tutors:', allTutors.length);
                console.log('[AdminDashboard] Unverified tutors:', pendingKycUsers.length);
                allTutors.forEach(u => console.log('[AdminDashboard] Tutor:', u.id, 'verified:', u.tutorProfile?.verified, 'docs:', u.tutorProfile?.verificationDocuments?.length));

                // Process Verifications List
                const pendingVerifications: VerificationRequest[] = pendingKycUsers.map(user => ({
                    id: user.id,
                    name: (user.tutorProfile?.firstName + ' ' + user.tutorProfile?.lastName) || 'Unknown User',
                    email: user.email || user.phoneNumber || 'No Email',
                    submittedAt: user.tutorProfile?.kyc?.submittedAt || new Date().toISOString(),
                    status: 'pending'
                }));
                setVerifications(pendingVerifications);

                // Process Earnings
                const earnings = completedBookings.reduce((sum, booking) =>
                    sum + ((booking as any).finalBillAmount || booking.totalPrice || 0), 0);

                // Process Complaints
                const pendingComplaints: Complaint[] = pendingComplaintsData.map(c => ({
                    id: c.id,
                    subject: c.issue || 'No Subject',
                    status: c.status,
                    createdAt: (c.createdAt as any)?.seconds
                        ? new Date((c.createdAt as any).seconds * 1000).toISOString()
                        : new Date().toISOString()
                }));
                setComplaints(pendingComplaints);

                // Update Stats
                setStats({
                    pendingVerifications: pendingKycUsers.length,
                    totalProviders: providers.length,
                    totalCustomers: customers.length,
                    totalEarnings: earnings,
                    pendingComplaints: pendingComplaintsData.length
                });

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 gap-4">
                    {/* KYC Requests Block */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
                        <div className="mb-4 text-gray-900">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">KYC Requests</h3>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                            <p className="text-sm text-gray-500 mb-1">Pending</p>
                        </div>
                    </div>

                    {/* New Complaints Block */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
                        <div className="mb-4 text-gray-900">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">New Complaints</h3>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-3xl font-bold text-gray-900">{stats.pendingComplaints}</p>
                            <p className="text-sm text-gray-500 mb-1">Alerts</p>
                        </div>
                    </div>

                    {/* All Customers Block */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
                        <div className="mb-4 text-gray-900">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">All Customers</h3>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                            <p className="text-sm text-gray-500 mb-1">Active</p>
                        </div>
                    </div>

                    {/* All Providers Block */}
                    <Link href="/admin/providers" className="block">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 h-full">
                            <div className="mb-4 text-gray-900">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">All Providers</h3>
                            <div className="flex items-end gap-2 mt-2">
                                <p className="text-3xl font-bold text-gray-900">{stats.totalProviders}</p>
                                <p className="text-sm text-gray-500 mb-1">Registered</p>
                            </div>
                        </div>
                    </Link>

                    {/* Total Earnings Block */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 col-span-2 md:col-span-1">
                        <div className="mb-4 text-gray-900">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Total Earnings</h3>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-3xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Verification Queue header removed as requested in previous step, so just sections below */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Verification Queue</h2>
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                            {verifications.length} Pending
                        </Badge>
                    </div>
                    {loading ? (
                        <p className="text-gray-400 text-sm py-4">Loading...</p>
                    ) : verifications.length === 0 ? (
                        <p className="text-gray-500 text-sm italic py-2">No pending verifications</p>
                    ) : verifications.length === 1 ? (
                        <div className="w-[320px] flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="truncate mr-4">
                                <p className="font-semibold text-gray-900 truncate">{verifications[0].name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Submitted: {new Date(verifications[0].submittedAt).toLocaleDateString()}</p>
                            </div>
                            <Link href={`/admin/verification/view?id=${verifications[0].id}`}>
                                <Badge variant="outline" className="cursor-pointer border-orange-500 text-orange-600 hover:bg-orange-50 px-4 py-1 whitespace-nowrap">
                                    Review
                                </Badge>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-2 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
                            {verifications.map((req) => (
                                <div key={req.id} className="w-[320px] flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all shrink-0">
                                    <div className="truncate mr-4">
                                        <p className="font-semibold text-gray-900 truncate">{req.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Submitted: {new Date(req.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <Link href={`/admin/verification/view?id=${req.id}`}>
                                        <Badge variant="outline" className="cursor-pointer border-orange-500 text-orange-600 hover:bg-orange-50 px-4 py-1 whitespace-nowrap">
                                            Review
                                        </Badge>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Complaints */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Complaints</h2>
                        <Badge className="bg-red-500 text-white hover:bg-red-600">
                            {complaints.length} Pending
                        </Badge>
                    </div>
                    {loading ? (
                        <p className="text-gray-400 text-sm py-4">Loading...</p>
                    ) : complaints.length === 0 ? (
                        <p className="text-gray-500 text-sm italic py-2">No pending complaints</p>
                    ) : complaints.length === 1 ? (
                        <div className="w-[320px] flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="truncate mr-4">
                                <p className="font-semibold text-gray-900 truncate">{complaints[0].subject}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Created: {new Date(complaints[0].createdAt).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="outline" className="cursor-pointer border-red-500 text-red-600 hover:bg-red-50 px-4 py-1 whitespace-nowrap">
                                View
                            </Badge>
                        </div>
                    ) : (
                        <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-2 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
                            {complaints.map((complaint) => (
                                <div key={complaint.id} className="w-[320px] flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all shrink-0">
                                    <div className="truncate mr-4">
                                        <p className="font-semibold text-gray-900 truncate">{complaint.subject}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Created: {new Date(complaint.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant="outline" className="cursor-pointer border-red-500 text-red-600 hover:bg-red-50 px-4 py-1 whitespace-nowrap">
                                        View
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
