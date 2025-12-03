'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { AdminService } from '@/lib/services/admin.service';
import { User, Complaint } from '@/lib/types/database';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, userData } = useAuth();
    const [verificationQueue, setVerificationQueue] = useState<User[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && userData?.role === 'admin') {
            Promise.all([
                AdminService.getPendingVerifications(),
                AdminService.getPendingComplaints(),
            ]).then(([verifications, pendingComplaints]) => {
                setVerificationQueue(verifications);
                setComplaints(pendingComplaints);
                setLoading(false);
            });
        }
    }, [user, userData]);

    const handleApprove = async (tutorId: string) => {
        try {
            await AdminService.approveTutor(tutorId);
            setVerificationQueue(prev => prev.filter(t => t.uid !== tutorId));
        } catch (error) {
            console.error('Failed to approve tutor:', error);
        }
    };

    const handleReject = async (tutorId: string) => {
        try {
            await AdminService.rejectTutor(tutorId, 'Documents did not meet requirements');
            setVerificationQueue(prev => prev.filter(t => t.uid !== tutorId));
        } catch (error) {
            console.error('Failed to reject tutor:', error);
        }
    };

    const handleResolveComplaint = async (complaintId: string) => {
        try {
            await AdminService.resolveComplaint(complaintId, 'Issue resolved');
            setComplaints(prev => prev.filter(c => c.id !== complaintId));
        } catch (error) {
            console.error('Failed to resolve complaint:', error);
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
                <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
                <div className="flex gap-4 mt-4">
                    <Link href="/admin" className="text-primary hover:underline">Dashboard</Link>
                    <Link href="/admin/subscriptions" className="text-primary hover:underline">Subscriptions</Link>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Verification Queue */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Verification Queue</h2>
                        <Badge>{verificationQueue.length} Pending</Badge>
                    </div>
                    <div className="space-y-4">
                        {verificationQueue.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No pending verifications
                                </CardContent>
                            </Card>
                        ) : (
                            verificationQueue.map((tutor) => (
                                <Card key={tutor.uid}>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {/* Provider Info */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    {/* Profile Picture */}
                                                    {tutor.tutorProfile?.profilePicture ? (
                                                        <img
                                                            src={tutor.tutorProfile.profilePicture}
                                                            alt="Profile"
                                                            className="w-16 h-16 rounded-full object-cover border-2 border-border cursor-pointer hover:opacity-80"
                                                            onClick={() => window.open(tutor.tutorProfile?.profilePicture, '_blank')}
                                                            title="Click to view full size"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl">
                                                            👤
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {tutor.tutorProfile?.firstName} {tutor.tutorProfile?.lastName}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">{tutor.email}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {tutor.tutorProfile?.city || 'Location not specified'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Verification Documents */}
                                            {tutor.tutorProfile?.verificationDocuments && tutor.tutorProfile.verificationDocuments.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">📄 Verification Documents:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {tutor.tutorProfile.verificationDocuments.map((doc, index) => (
                                                            <a
                                                                key={index}
                                                                href={doc}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-block"
                                                            >
                                                                <img
                                                                    src={doc}
                                                                    alt={`Document ${index + 1}`}
                                                                    className="h-24 w-auto rounded border-2 border-border hover:border-primary cursor-pointer transition-all hover:scale-105"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    onClick={() => handleApprove(tutor.uid)}
                                                    className="flex-1"
                                                >
                                                    ✓ Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(tutor.uid)}
                                                    variant="outline"
                                                    className="flex-1 text-red-600 hover:text-red-700"
                                                >
                                                    ✗ Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Complaints */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Complaints</h2>
                        <Badge variant="destructive">{complaints.length} Pending</Badge>
                    </div>
                    <div className="space-y-4">
                        {complaints.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No pending complaints
                                </CardContent>
                            </Card>
                        ) : (
                            complaints.map((complaint) => (
                                <Card key={complaint.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold">{complaint.issue}</h3>
                                            <span className="text-xs text-muted-foreground">
                                                {complaint.createdAt?.toDate().toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {complaint.description}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline">
                                                View Details
                                            </Button>
                                            <Button size="sm" onClick={() => handleResolveComplaint(complaint.id)}>
                                                Resolve
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
