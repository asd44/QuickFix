'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function OTPLogin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { signInWithPhone, verifyOTP } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => { }
            });
        }
        return () => {
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = null;
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
            if (!recaptchaVerifierRef.current) throw new Error('Recaptcha not initialized');

            await signInWithPhone(formattedPhoneNumber, recaptchaVerifierRef.current);
            setStep('otp');
            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']); // Reset OTP
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
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
            const userExists = await verifyOTP(otpString);
            if (userExists) {
                router.push('/');
            } else {
                const role = searchParams.get('role') || 'student';
                router.push(`/auth/signup?role=${role}`);
            }
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto px-4">
            {step === 'otp' && (
                <button
                    onClick={() => setStep('phone')}
                    className="mb-8 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
            )}

            <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">
                {step === 'phone' ? 'Phone Login' : 'Enter OTP Code'}
            </h2>

            {step === 'otp' && (
                <p className="text-center text-gray-600 mb-8 px-4 leading-relaxed">
                    Check your SMS! We've sent a one-time verification code to +91 {phoneNumber}.
                    Enter the code below to verify your account.
                </p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <div className="flex h-12">
                            <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 font-medium">
                                +91
                            </span>
                            <input
                                type="tel"
                                placeholder="9876543210"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhoneNumber(val);
                                }}
                                className="flex-1 block w-full px-4 border border-gray-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                                required
                            />
                        </div>
                    </div>

                    <div id="recaptcha-container"></div>

                    <button
                        type="submit"
                        disabled={loading || phoneNumber.length !== 10}
                        className="w-full bg-blue-600 text-white h-12 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-8">
                    <div className="flex justify-center gap-3 sm:gap-4">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-gray-200 rounded-full text-center text-xl sm:text-2xl font-semibold focus:border-purple-600 focus:ring-0 outline-none transition-colors bg-gray-50 focus:bg-white text-gray-900"
                            />
                        ))}
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-gray-600 text-sm">
                            You can resend the code in {timer} seconds
                        </p>
                        <button
                            type="button"
                            onClick={() => handleSendOTP()}
                            disabled={!canResend || loading}
                            className={`text-sm font-semibold hover:underline decoration-2 underline-offset-4 ${canResend
                                    ? 'text-purple-600 cursor-pointer'
                                    : 'text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Resend code
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full bg-blue-600 text-white h-12 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-4"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
            )}
        </div>
    );
}
