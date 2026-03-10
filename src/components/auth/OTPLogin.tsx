'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { User } from '@/lib/types/database';

export default function OTPLogin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verificationId, setVerificationId] = useState<string>('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Listen for phoneCodeSent event to get verificationId
    useEffect(() => {
        let listenerHandle: any;

        FirebaseAuthentication.addListener('phoneCodeSent', (event: any) => {
            console.log('phoneCodeSent event received:', event);
            if (event.verificationId) {
                setVerificationId(event.verificationId);
                console.log('Verification ID captured:', event.verificationId);
            }
        }).then(handle => {
            listenerHandle = handle;
        });

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer, step]);

    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (phoneNumber.length !== 10) throw new Error('Please enter a valid 10-digit phone number');
            const formattedPhoneNumber = `+91${phoneNumber}`;

            console.log('Sending OTP...', formattedPhoneNumber);

            // Add error listener BEFORE sending OTP
            let errorHandle: any;
            FirebaseAuthentication.addListener('phoneVerificationFailed', (event: any) => {
                console.error('Phone verification FAILED:', event);
                setError(event.message || 'Phone verification failed');
                setLoading(false);
            }).then(handle => {
                errorHandle = handle;
            });

            // Send OTP - works for both test and real numbers
            // Using timeout: 0 forces SMS delivery instead of auto-verification  
            console.log('Calling signInWithPhoneNumber...');
            const result = await FirebaseAuthentication.signInWithPhoneNumber({
                phoneNumber: formattedPhoneNumber,
                timeout: 0 // Force SMS OTP instead of auto-verification
            }) as any;

            console.log('signInWithPhoneNumber returned:', JSON.stringify(result));

            // Store verificationId for later confirmation
            // The verificationId might be in result directly or will come via phoneCodeSent event
            if (result?.verificationId) {
                console.log('Captured verificationId from result:', result.verificationId);
                setVerificationId(result.verificationId);
                setStep('otp');
                setTimer(60);
                setCanResend(false);
            } else {
                console.log('No verificationId in result, waiting for phoneCodeSent event...');
                // Wait for the phoneCodeSent event with timeout
                const waitForVerificationId = new Promise<string>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout waiting for verification code'));
                    }, 60000); // 60 second timeout

                    FirebaseAuthentication.addListener('phoneCodeSent', (event: any) => {
                        console.log('phoneCodeSent event received:', event);
                        if (event.verificationId) {
                            clearTimeout(timeout);
                            console.log('Got verificationId from event:', event.verificationId);
                            resolve(event.verificationId);
                        }
                    });
                });

                try {
                    const verId = await waitForVerificationId;
                    setVerificationId(verId);
                    console.log('VerificationId set:', verId);
                } catch (waitError) {
                    throw new Error('Failed to receive verification code. Please try again.');
                }
            }

            setStep('otp');
            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
        } catch (err: any) {
            console.error('OTP send error:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) return;

        setError('');
        setLoading(true);

        try {
            console.log('Verifying OTP with Firebase, verificationId:', verificationId);

            if (!verificationId) {
                throw new Error('Verification session expired. Please request a new OTP.');
            }

            // Confirm the verification code with Firebase (native only)
            const result = await FirebaseAuthentication.confirmVerificationCode({
                verificationId: verificationId,
                verificationCode: otpString
            });

            console.log('Firebase OTP verified successfully, user:', result.user?.uid);

            if (result.user?.uid) {
                // Retry logic for fetching user profile
                let userDoc = null;
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts && !userDoc) {
                    try {
                        console.log(`Fetching user profile attempt ${attempts + 1}/${maxAttempts}...`);
                        userDoc = await FirestoreREST.getDoc<User>('users', result.user.uid);
                        if (userDoc) break;
                        // Wait 1 second before retry if null
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (err) {
                        console.error('Error fetching user doc:', err);
                    }
                    attempts++;
                }

                if (userDoc && userDoc.role) {
                    console.log('User exists with role:', userDoc.role);
                    // User is registered - redirect based on role
                    if (userDoc.role === 'tutor') {
                        // Use router.push for instant client-side navigation
                        // This avoids reloading the app and hitting the root page redirection logic
                        router.push('/tutor/dashboard');
                    } else {
                        router.push('/');
                    }
                } else {
                    console.log('User profile not found after retries, redirecting to role selection');
                    // User not registered - go to role selection using router to preserve session state
                    router.push('/auth/role-selection');
                }
            }
        } catch (err: any) {
            console.error('OTP verification error:', err);
            setError(err.message || 'Invalid OTP. Please try again.');
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = () => {
        if (canResend) {
            setTimer(60);
            setCanResend(false);
            handleSendOTP();
        }
    };

    return (
        <div className="w-full">
            <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to QuickFix</h2>
                <p className="text-gray-500 text-sm">Sign in to access your services</p>
            </div>

            {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">
                            Mobile Number
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-medium border-r border-gray-200 pr-3">+91</span>
                            </div>
                            <input
                                type="tel"
                                maxLength={10}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-20 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                placeholder="Enter mobile number"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || phoneNumber.length !== 10}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Sending OTP...
                            </span>
                        ) : 'Get Verification Code'}
                    </button>

                    <div className="pt-6 text-center">
                        <button
                            type="button"
                            onClick={() => router.push('/auth/admin/login')}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Log in as Administrator
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <button
                        onClick={() => setStep('phone')}
                        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Change Number
                    </button>

                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Phone</h3>
                        <p className="text-sm text-gray-500">
                            Code sent to <span className="font-semibold text-gray-900">+91 {phoneNumber}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center animate-in fade-in">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all caret-orange-500"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    <div className="text-center">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                            >
                                Resend verification code
                            </button>
                        ) : (
                            <p className="text-sm text-gray-400 font-medium">
                                Resend code in <span className="text-gray-600">{timer}s</span>
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : 'Verify & Continue'}
                    </button>
                </div>
            )}
        </div>
    );
}
