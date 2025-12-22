'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/admin/login', '/manifest.json', '/icon-192.png', '/icon-512.png', '/welcome'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    // Flag to track initial app load
    const isFirstLoad = useRef(true);
    const { user, userData, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Native Capacitor Firebase auth check
    const [nativeUser, setNativeUser] = useState<{ uid: string; email?: string | null; phoneNumber?: string | null } | null>(null);
    const [checkingNativeAuth, setCheckingNativeAuth] = useState(Capacitor.isNativePlatform());

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

    // Check for Capacitor native Firebase auth (for OTP verification flow)
    // Also listen for auth state changes to clear nativeUser on signout
    useEffect(() => {
        let authListener: any = null;

        const checkNativeAuth = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

                    // Check current user
                    const result = await FirebaseAuthentication.getCurrentUser();
                    console.log('[AuthGuard] Native auth check:', result);
                    if (result.user) {
                        setNativeUser({
                            uid: result.user.uid,
                            email: result.user.email,
                            phoneNumber: result.user.phoneNumber
                        });
                    } else {
                        setNativeUser(null);
                    }

                    // Listen for auth state changes (signout, etc.)
                    authListener = await FirebaseAuthentication.addListener('authStateChange', (event) => {
                        console.log('[AuthGuard] Native auth state changed:', event);
                        if (event.user) {
                            setNativeUser({
                                uid: event.user.uid,
                                email: event.user.email,
                                phoneNumber: event.user.phoneNumber
                            });
                        } else {
                            setNativeUser(null);
                        }
                    });

                } catch (error) {
                    console.error('[AuthGuard] Native auth check error:', error);
                }
            }
            setCheckingNativeAuth(false);
        };
        checkNativeAuth();

        return () => {
            if (authListener) {
                authListener.remove();
            }
        };
    }, []);

    // Effective user check - web SDK user OR Capacitor native user
    const effectiveUser = user || nativeUser;
    const isAuthLoading = loading || checkingNativeAuth;

    useEffect(() => {
        console.log('[AuthGuard] Effect triggered:', { loading, checkingNativeAuth, hasUser: !!user, hasNativeUser: !!nativeUser, hasUserData: !!userData, pathname });

        if (isAuthLoading) {
            console.log('[AuthGuard] Still loading auth state');
            return;
        }

        // On first load, if user exists but has no profile (incomplete signup), log them out
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            console.log('[AuthGuard] First load complete');
            // DISABLED: Don't sign out on first load - let OTP users complete signup
            // if (user && !userData) {
            //     signOut().then(() => {
            //         router.replace('/welcome');
            //     });
            //     return;
            // }
        }

        // 1. Unauthenticated User (neither web SDK nor native user)
        if (!effectiveUser) {
            console.log('[AuthGuard] No user (web or native), checking pathname:', pathname);
            // If trying to access protected route, redirect to welcome
            if (!PUBLIC_PATHS.includes(pathname)) {
                console.log('[AuthGuard] Redirecting to welcome - no user on protected route');
                router.push('/welcome');
            }
            return;
        }

        // 2. Authenticated but Incomplete Profile  
        // (Has user from web SDK or native, but no Firestore profile)
        if (effectiveUser && !userData) {
            console.log('[AuthGuard] User authenticated but no profile data');

            // Skip redirect for admin login page - admins use email auth and should have profiles
            // Also skip for /admin path - allow admins to access while their data loads
            const isAdminPath = pathname.startsWith('/admin') || pathname === '/auth/admin/login';

            // If user has email (admin), wait for data instead of redirecting to signup
            // Phone auth users (customers/providers) go to signup
            if (effectiveUser.email && !effectiveUser.phoneNumber) {
                console.log('[AuthGuard] Email user (likely admin), waiting for data to load...');
                // Don't redirect - let data load
                return;
            }

            // Force to signup page if not already there, BUT skip if on login page (to allow OTPLogin to handle redirect with role)
            if (pathname !== '/auth/signup' && pathname !== '/auth/login' && !isAdminPath) {
                console.log('[AuthGuard] Redirecting to signup');
                // Preserve role parameter from current URL if present
                const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                const role = urlParams?.get('role');
                const signupUrl = role ? `/auth/signup?role=${role}` : '/auth/signup';
                router.push(signupUrl);
            } else {
                console.log('[AuthGuard] Already on signup/login/admin, allowing access');
            }
            return;
        }

        // 3. Authenticated and Complete Profile
        if (user && userData) {
            console.log('[AuthGuard] User authenticated with profile data');
            // If on login or signup page, redirect to dashboard
            // NOTE: Don't redirect from welcome - let users re-login with different role if they sign out first
            if (pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/auth/admin/login') {
                if (userData.role === 'admin') {
                    console.log('[AuthGuard] Redirecting admin to dashboard');
                    router.push('/admin');
                } else {
                    console.log('[AuthGuard] Redirecting user to home');
                    router.push('/');
                }
            }

            // If admin tries to access root, redirect to admin dashboard
            if (userData.role === 'admin' && pathname === '/') {
                console.log('[AuthGuard] Redirecting admin from root to admin dashboard');
                router.push('/admin');
            }
        }
    }, [user, userData, loading, pathname, router, signOut, effectiveUser, isAuthLoading, nativeUser, checkingNativeAuth]);

    // Show loading spinner while checking auth state (web SDK or native)
    if (isAuthLoading) {
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
    console.log('[AuthGuard] Render check:', { effectiveUser: !!effectiveUser, pathname, isPublic: PUBLIC_PATHS.includes(pathname), userData: !!userData });
    if (!effectiveUser && !PUBLIC_PATHS.includes(pathname)) {
        console.log('[AuthGuard] Blocking render - no user on non-public path');
        return null;
    }

    // For email users (admin), allow access to admin paths while data loads
    const isEmailUser = effectiveUser?.email && !effectiveUser?.phoneNumber;
    const isAdminPath = pathname.startsWith('/admin') || pathname === '/auth/admin/login';

    if (effectiveUser && !userData && pathname !== '/auth/signup' && pathname !== '/auth/login' && !isAdminPath && !isEmailUser) {
        console.log('[AuthGuard] Blocking render - phone user with no data on non-signup path');
        return null;
    }

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
