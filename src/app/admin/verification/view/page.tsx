'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '@/lib/types/database';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import Link from 'next/link';

function VerificationDetailsContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    const router = useRouter();
    const [provider, setProvider] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchProvider = async () => {
            if (!userId) return;
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProvider(docSnap.data() as User);
                } else {
                    console.error("Provider not found");
                }
            } catch (error) {
                console.error("Error fetching provider:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProvider();
    }, [userId]);

    const [showConfirm, setShowConfirm] = useState(false);
    const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);

    const initiateAction = (type: 'approved' | 'rejected') => {
        setActionType(type);
        setShowConfirm(true);
    };

    const confirmAction = async () => {
        if (!provider || !userId || !actionType) return;
        setProcessing(true);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'tutorProfile.verified': actionType === 'approved',
                'tutorProfile.kyc.status': actionType,
                'tutorProfile.kyc.rejectionReason': actionType === 'rejected' ? 'Documents did not match criteria.' : null
            });
            router.push('/admin');
        } catch (error) {
            console.error("Error updating verification status:", error);
        } finally {
            setProcessing(false);
            setShowConfirm(false);
        }
    };

    if (!userId) {
        return <div className="min-h-screen flex items-center justify-center">Invalid Request</div>;
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!provider) {
        return <div className="min-h-screen flex items-center justify-center">Provider not found</div>;
    }

    const kyc = provider.tutorProfile?.kyc;

    return (

        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#0f172a] text-white shadow-md sticky top-0 z-30">
                <div className="px-6 py-4 flex items-center gap-4">
                    <Link href="/admin" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold">Review Request</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Provider Details */}
                        <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-0">
                                <CardTitle>Provider Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Name</label>
                                    <p className="font-medium text-lg text-gray-900">
                                        {provider.tutorProfile
                                            ? `${provider.tutorProfile.firstName} ${provider.tutorProfile.lastName}`
                                            : provider.email}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Phone</label>
                                    <p className="font-medium text-gray-900">{provider.phoneNumber || "Not provided"}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Service Type</label>
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
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Bio</label>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {provider.tutorProfile?.bio || 'No bio provided'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KYC Documents */}
                        <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-0">
                                <CardTitle>KYC Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                {kyc ? (
                                    <>
                                        <div>
                                            <label className="text-sm text-gray-600 mb-1 block">Selfie / Photo</label>
                                            {kyc.photoUrl ? (
                                                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                    <img src={kyc.photoUrl} alt="Provider Photo" className="object-cover w-full h-full" />
                                                </div>
                                            ) : (
                                                <p className="text-red-500">No photo uploaded</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-600 mb-1 block">ID Proof</label>
                                            {kyc.idProofUrl ? (
                                                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                    {kyc.idProofUrl.toLowerCase().includes('.pdf') ? (
                                                        <iframe src={kyc.idProofUrl} className="w-full h-full" />
                                                    ) : (
                                                        <img src={kyc.idProofUrl} alt="ID Proof" className="object-cover w-full h-full" />
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-red-500">No ID proof uploaded</p>
                                            )}
                                            {kyc.idProofUrl && (
                                                <a href={kyc.idProofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                                                    View Full Document
                                                </a>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-600 mb-1 block">ID Number</label>
                                            <p className="font-medium text-gray-900">{kyc.idNumber || "Not provided"}</p>
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <Button
                                                onClick={() => initiateAction('approved')}
                                                disabled={processing}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() => initiateAction('rejected')}
                                                disabled={processing}
                                                variant="destructive"
                                                className="flex-1"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-yellow-600">No KYC data submitted.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Confirmation Modal */}
                {showConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
                            <p className="text-gray-600">
                                Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this provider?
                                {actionType === 'approved' ? ' They will be verified immediately.' : ' This action will mark the request as rejected.'}
                            </p>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={() => setShowConfirm(false)}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmAction}
                                    className={`flex-1 ${actionType === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function VerificationDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerificationDetailsContent />
        </Suspense>
    );
}
