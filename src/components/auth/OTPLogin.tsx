'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

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

            // Native auth is now complete - redirect to signup to complete profile
            // Use window.location.search directly for better Capacitor compatibility
            const urlParams = new URLSearchParams(window.location.search);
            const role = urlParams.get('role') || 'student';
            console.log('OTP verified, redirecting to signup with role:', role);

            // Use window.location for reliable Capacitor navigation
            window.location.href = `/auth/signup?role=${role}`;
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome to QuickFix</h2>
                    <p className="text-gray-600">Sign in or Sign up with your phone</p>
                </div>

                {step === 'phone' ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-semibold text-center">Phone Login</h3>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <div className="flex items-center space-x-2">
                                <span className="bg-gray-100 px-4 py-3 rounded-lg text-gray-700 font-medium">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Enter 10-digit number"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || phoneNumber.length !== 10}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-center text-gray-600 text-sm">Are you an administrator?</p>
                            <button
                                type="button"
                                onClick={() => router.push('/auth/admin/login')}
                                className="w-full mt-2 text-orange-600 font-medium hover:text-orange-700"
                            >
                                Admin Login
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => setStep('phone')}
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-center">Enter OTP Code</h3>
                            <p className="text-center text-gray-600">
                                Check your SMS! We've sent a one-time verification code to +91 {phoneNumber}. Enter the code below to verify your account.
                            </p>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                                        disabled={loading}
                                    />
                                ))}
                            </div>

                            <div className="text-center text-sm text-gray-600">
                                {canResend ? (
                                    <button
                                        onClick={handleResend}
                                        className="text-purple-600 font-medium hover:text-purple-700"
                                    >
                                        Resend code
                                    </button>
                                ) : (
                                    <p>You can resend the code in {timer} seconds</p>
                                )}
                            </div>

                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.join('').length !== 6}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-center text-gray-600 text-sm">Are you an administrator?</p>
                            <button
                                onClick={() => router.push('/auth/admin/login')}
                                className="w-full mt-2 text-orange-600 font-medium hover:text-orange-700"
                            >
                                Admin Login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
