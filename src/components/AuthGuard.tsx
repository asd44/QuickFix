'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/admin/login', '/manifest.json', '/icon-192.png', '/icon-512.png', '/welcome'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    // Flag to track initial app load
    const isFirstLoad = useRef(true);
    const { user, userData, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // State for complaint form - ALWAYS Call Hooks at Top Level
    const [complaintForm, setComplaintForm] = useState({ mobile: '', description: '' });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [formError, setFormError] = useState('');

    const handleComplaintSubmit = async () => {
        if (!complaintForm.mobile || !complaintForm.description) {
            setFormError('Please fill in both fields.');
            return;
        }
        setFormError('');
        setSubmitStatus('submitting');

        try {
            // Import dynamically to avoid circular dependencies
            const { ComplaintService } = await import('@/lib/services/complaint.service');

            await ComplaintService.submitSuspensionAppeal({
                userId: user?.uid || '',
                userEmail: user?.email || '',
                userName: userData?.tutorProfile?.firstName ? `${userData.tutorProfile.firstName} ${userData.tutorProfile.lastName}` : 'Provider',
                mobile: complaintForm.mobile,
                description: complaintForm.description
            });

            setSubmitStatus('success');
        } catch (error: any) {
            console.error('Failed to submit complaint:', error);
            setFormError(error.message || 'Failed to submit complaint. Please try again.');
            setSubmitStatus('idle'); // Allow retry
        }
    };

    useEffect(() => {
        if (loading) return;

        // On first load, if user exists but has no profile (incomplete signup), log them out
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            // Only redirect if we are NOT already on the signup page
            // But user requested: "if user closes the app... takes back to the role selection page"
            // So if they just opened the app and have incomplete profile, we should reset.
            if (user && !userData) {
                signOut().then(() => {
                    router.replace('/welcome');
                });
                return;
            }
        }

        // 1. Unauthenticated User
        if (!user) {
            // If trying to access protected route, redirect to welcome
            if (!PUBLIC_PATHS.includes(pathname)) {
                router.push('/welcome');
            }
            return;
        }

        // 2. Authenticated but Incomplete Profile
        if (user && !userData) {
            // Force to signup page if not already there, BUT skip if on login page (to allow OTPLogin to handle redirect with role)
            if (pathname !== '/auth/signup' && pathname !== '/auth/login') {
                router.push('/auth/signup');
            }
            return;
        }

        // 3. Authenticated and Complete Profile
        if (user && userData) {
            // If on login or signup page, redirect to dashboard
            if (pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/auth/admin/login' || pathname === '/welcome') {
                if (userData.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            }

            // If admin tries to access root, redirect to admin dashboard
            if (userData.role === 'admin' && pathname === '/') {
                router.push('/admin');
            }
        }
    }, [user, userData, loading, pathname, router, signOut]);

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    // State for complaint form
    // Don't render children if redirecting (prevent flash of content)
    if (!user && !PUBLIC_PATHS.includes(pathname)) return null;
    if (user && !userData && pathname !== '/auth/signup') return null;

    // Check for suspension (Admin Deactivation)
    // Only block if user is logged in, has data, and is marked suspended.
    if (user && userData && userData.role === 'tutor' && userData.tutorProfile?.isSuspended) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white max-w-md w-full rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="bg-red-600 p-6 flex flex-col items-center text-white">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-xl font-bold text-center">Account Deactivated</h2>
                    </div>

                    <div className="p-6">
                        {submitStatus === 'success' ? (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Complaint Submitted</h3>
                                <p className="text-gray-600 text-sm">
                                    We have received your complaint. Our support team will review it and contact you on the provided number.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-center text-gray-600 text-sm">
                                    Your account is deactivated. Please submit a complaint to support.
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            value={complaintForm.mobile}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, mobile: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                            placeholder="Enter your contact number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Complaint Description <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={complaintForm.description}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm h-24 resize-none"
                                            placeholder="Explain your issue..."
                                        />
                                    </div>

                                    {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}

                                    <button
                                        onClick={handleComplaintSubmit}
                                        disabled={submitStatus === 'submitting'}
                                        className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                                    >
                                        {submitStatus === 'submitting' ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                                Send Complaint
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    window.close();
                                    window.location.href = 'about:blank';
                                }}
                                className="w-full py-2.5 px-4 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Close App
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
