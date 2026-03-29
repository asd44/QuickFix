

'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';

export default function KYCPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [idProof, setIdProof] = useState<File | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    if (!user || !userData) return null;

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setUploadStatus("Could not access camera. Please allow camera permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        setCapturedPhoto(blob);
                        setPhotoPreview(URL.createObjectURL(blob));
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setPhotoPreview(null);
        startCamera();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!capturedPhoto) {
            setUploadStatus('Please capture your photo first.');
            return;
        }
        if (!idProof) {
            setUploadStatus('Please upload your ID proof.');
            return;
        }

        setLoading(true);
        setUploadStatus('Uploading documents...');

        try {
            // Upload Captured Photo
            const photoRef = ref(storage, `verification-docs/${user.uid}/photo_${Date.now()}.jpg`);
            await uploadBytes(photoRef, capturedPhoto);
            const photoUrl = await getDownloadURL(photoRef);

            // Upload ID Proof
            const idProofRef = ref(storage, `verification-docs/${user.uid}/id_proof_${Date.now()}`);
            await uploadBytes(idProofRef, idProof);
            const idProofUrl = await getDownloadURL(idProofRef);

            // Update User Profile with KYC data using FirestoreREST
            await FirestoreREST.updateDoc('users', user.uid, {
                'tutorProfile.kyc': {
                    photoUrl,
                    idProofUrl,
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                }
            });

            setUploadStatus('Documents submitted successfully! Verification pending.');
            setTimeout(() => {
                router.push('/tutor/profile/details');
            }, 2000);

        } catch (error) {
            console.error('Error uploading KYC documents:', error);
            setUploadStatus('Failed to upload documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-4 sticky top-0 bg-white z-10">
                <Link href="/tutor/profile/details">
                    <span className="text-2xl">←</span>
                </Link>
                <h1 className="text-xl font-bold">KYC Verification</h1>
            </div>

            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Verification Steps</CardTitle>
                        <p className="text-sm text-muted-foreground">Complete the following steps to verify your profile.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Step 1: Photo Capture or Upload */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Step 1: Your Photo</h3>
                                <p className="text-sm text-muted-foreground">Take a selfie using the camera OR upload a clear photo of yourself.</p>

                                {!isCameraOpen && !photoPreview && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button type="button" onClick={startCamera} variant="outline" className="h-32 flex flex-col gap-2">
                                            <span className="text-4xl">📷</span>
                                            <span>Open Camera</span>
                                        </Button>
                                        <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative hover:bg-gray-50 transition-colors">
                                            <span className="text-4xl mb-2">📁</span>
                                            <span className="text-sm font-medium">Upload Photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setCapturedPhoto(e.target.files[0]);
                                                        setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {isCameraOpen && (
                                    <div className="relative rounded-lg overflow-hidden bg-black">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                            <Button type="button" onClick={capturePhoto} className="rounded-full w-16 h-16 p-0 border-4 border-white bg-red-500 hover:bg-red-600">
                                            </Button>
                                        </div>
                                        <Button type="button" onClick={stopCamera} variant="secondary" size="sm" className="absolute top-2 right-2">
                                            Cancel
                                        </Button>
                                    </div>
                                )}

                                <canvas ref={canvasRef} className="hidden" />

                                {photoPreview && (
                                    <div className="relative">
                                        <img src={photoPreview} alt="Selected" className="w-full h-64 object-cover rounded-lg" />
                                        <Button type="button" onClick={retakePhoto} variant="secondary" size="sm" className="absolute bottom-2 right-2">
                                            Change Photo
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: ID Proof Upload */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-lg">Step 2: Upload ID Proof</h3>
                                <p className="text-sm text-muted-foreground">Upload a clear image of your Aadhaar, PAN, or Voter ID.</p>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(e, setIdProof)}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                            </div>

                            {uploadStatus && (
                                <p className={`text-sm ${uploadStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                    {uploadStatus}
                                </p>
                            )}

                            <Button type="submit" className="w-full py-6 text-lg" disabled={loading || !capturedPhoto || !idProof}>
                                {loading ? 'Submitting...' : 'Submit for Verification'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
