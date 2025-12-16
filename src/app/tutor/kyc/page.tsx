'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { TutorService } from '@/lib/services/tutor.service';

export default function KYCPage() {
    const router = useRouter();
    const selfieInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);

    const [selfie, setSelfie] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [idType, setIdType] = useState<string>('aadhar'); // default
    const [idNumber, setIdNumber] = useState('');
    const [idFile, setIdFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelfie(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelfiePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdFile(file);
        }
    };

    const [submitted, setSubmitted] = useState(false);

    // ... (inside component)

    const handleSubmit = async () => {
        if (!selfie || !idFile || !idNumber || !userData?.uid) return;

        setLoading(true);
        try {
            await TutorService.submitKYC(userData.uid, {
                selfie,
                idFile,
                idNumber,
                idType
            });
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('KYC Submission failed:', error);
            alert('Failed to submit documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = selfie && idNumber && idFile;

    const { userData } = useAuth();

    const status = userData?.tutorProfile?.kyc?.status;
    const isVerified = userData?.tutorProfile?.verified;
    // Show form if NOT verified AND NOT pending (includes re-submission case)
    const isPending = status === 'pending' || submitted;
    const showForm = !isVerified && !isPending;

    // If verified, show success message and hide form
    if (isVerified) {
        return (
            <div className="min-h-screen bg-white pb-32">
                {/* Header */}
                <div className="bg-[#5A0E24] px-4 pt-12 pb-6 text-white rounded-b-[2.5rem] shadow-md relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold">KYC Verification</h1>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-green-800 mb-2">Verification Approved</h3>
                        <p className="text-green-700">Your profile has been successfully verified! You can now accept bookings and access all provider features.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* Header */}
            <div className="bg-[#5A0E24] px-4 pt-12 pb-6 text-white rounded-b-[2.5rem] shadow-md relative z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">KYC Verification</h1>
                </div>
            </div>

            <div className="p-6 space-y-8">

                {/* Verification Status Messages */}
                {status === 'rejected' ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-red-800">Verification Rejected</h3>
                                <p className="text-sm text-red-700 mt-1">Verification rejected by the admin. Please upload the correct documents again.</p>
                            </div>
                        </div>
                    </div>
                ) : isPending ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-800">Verification Pending</h3>
                                <p className="text-sm text-blue-700 mt-1">Waiting for documents approval. Admin will verify your details shortly.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-yellow-800">Verification Pending</h3>
                                <p className="text-sm text-yellow-700 mt-1">Please submit your documents to get your profile verified and start accepting bookings.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Section - Hide if Pending */}
                {showForm && (
                    <>
                        {/* 1. Selfie Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#5A0E24] text-white flex items-center justify-center text-xs">1</span>
                                Take a Selfie
                            </h2>
                            <div className="flex flex-col items-center">
                                <div
                                    onClick={() => selfieInputRef.current?.click()}
                                    className="w-40 h-40 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors relative"
                                >
                                    {selfiePreview ? (
                                        <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm text-gray-500 font-medium">Tap to Capture</span>
                                        </div>
                                    )}
                                    <input
                                        ref={selfieInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="user" // Forces camera on mobile
                                        className="hidden"
                                        onChange={handleSelfieChange}
                                    />
                                </div>
                                {selfiePreview && (
                                    <button
                                        onClick={() => selfieInputRef.current?.click()}
                                        className="mt-3 text-[#5A0E24] text-sm font-semibold hover:underline"
                                    >
                                        Retake Photo
                                    </button>
                                )}
                                <p className="text-xs text-gray-500 mt-2 text-center">Please ensure your face is clearly visible.</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100"></div>

                        {/* 2. ID Choice & Number */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#5A0E24] text-white flex items-center justify-center text-xs">2</span>
                                Identity Proof
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select ID Type</label>
                                    <select
                                        value={idType}
                                        onChange={(e) => setIdType(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#5A0E24] focus:ring-1 focus:ring-[#5A0E24]"
                                    >
                                        <option value="aadhar">Aadhar Card</option>
                                        <option value="pan">PAN Card</option>
                                        <option value="driving_license">Driving License</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                                    <input
                                        type="text"
                                        placeholder={`Enter ${idType === 'aadhar' ? 'Aadhar' : idType === 'pan' ? 'PAN' : 'License'} Number`}
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5A0E24] focus:ring-1 focus:ring-[#5A0E24]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100"></div>

                        {/* 3. Upload ID Document */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#5A0E24] text-white flex items-center justify-center text-xs">3</span>
                                Upload ID Document
                            </h2>

                            <div
                                onClick={() => idInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${idFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
                            >
                                <input
                                    ref={idInputRef}
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleIdFileChange}
                                />

                                {idFile ? (
                                    <>
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="font-semibold text-green-800 text-sm truncate max-w-full px-4">{idFile.name}</p>
                                        <p className="text-xs text-green-600 mt-1">Tap to change file</p>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-gray-700 font-medium text-sm">Upload {idType.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500 mt-1">Supports Image or PDF</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={!isFormValid || loading}
                                isLoading={loading}
                                className="w-full py-4 text-lg bg-[#5A0E24] hover:bg-[#4a0b1d] rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Documents
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

