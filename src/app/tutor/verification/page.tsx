'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { StorageService } from '@/lib/services/storage.service';
import { UserService } from '@/lib/services/user.service';

export default function TutorVerificationPage() {
    const { user, userData } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [photoSuccess, setPhotoSuccess] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    if (!user || !userData?.tutorProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a service provider to access this page</p>
            </div>
        );
    }

    const profile = userData.tutorProfile;
    const isVerified = profile.verified;
    const hasDocuments = profile.verificationDocuments && profile.verificationDocuments.length > 0;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.target.files);
        setError('');
    };

    const handleUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const uploadPromises = Array.from(selectedFiles).map(file =>
                StorageService.uploadVerificationDocument(user.uid, file)
            );

            const urls = await Promise.all(uploadPromises);

            // Update user profile with document URLs
            await UserService.updateProfile(user.uid, {
                'tutorProfile.verificationDocuments': urls,
            });

            setSuccess('Documents uploaded successfully! Admin will review them soon.');
            setSelectedFiles(null);

            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload documents');
        } finally {
            setUploading(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhoto(file);
            setPhotoError('');

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoUpload = async () => {
        if (!selectedPhoto) {
            setPhotoError('Please select a photo');
            return;
        }

        setPhotoUploading(true);
        setPhotoError('');
        setPhotoSuccess('');

        try {
            const photoUrl = await StorageService.uploadProfilePicture(user.uid, selectedPhoto);

            // Update user profile with photo URL
            await UserService.updateProfile(user.uid, {
                'tutorProfile.profilePicture': photoUrl,
            });

            setPhotoSuccess('Profile photo updated successfully!');
            setSelectedPhoto(null);
            setPhotoPreview('');

        } catch (err: any) {
            console.error('Photo upload error:', err);
            setPhotoError(err.message || 'Failed to upload photo');
        } finally {
            setPhotoUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Profile & Verification</h1>

            {/* Profile Photo Upload */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Profile Photo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Current/Preview Photo */}
                            <div className="flex-shrink-0">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-2 border-border">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : profile.profilePicture ? (
                                        <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-5xl">
                                            👤
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Upload a professional photo to make your profile stand out
                                    </p>
                                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                                        <li>Use a clear, high-quality headshot</li>
                                        <li>Professional appearance recommended</li>
                                        <li>Max file size: 5MB</li>
                                        <li>Accepted formats: JPG, PNG</li>
                                    </ul>
                                </div>

                                {photoError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                                        <p className="text-sm text-red-600 dark:text-red-400">{photoError}</p>
                                    </div>
                                )}

                                {photoSuccess && (
                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                        <p className="text-sm text-green-600 dark:text-green-400">{photoSuccess}</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="photo-upload"
                                        className="inline-flex items-center justify-center px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                        Choose Photo
                                    </label>

                                    {selectedPhoto && (
                                        <Button
                                            onClick={handlePhotoUpload}
                                            disabled={photoUploading}
                                        >
                                            {photoUploading ? 'Uploading...' : 'Upload Photo'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Verification Status */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isVerified ? (
                            <div className="flex items-center gap-3">
                                <Badge className="bg-green-500">✓ Verified</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Your account has been verified by admin
                                </p>
                            </div>
                        ) : hasDocuments ? (
                            <div className="flex items-center gap-3">
                                <Badge className="bg-yellow-500">⏳ Pending Review</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Your documents are being reviewed by admin
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary">⚠️ Not Verified</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Upload verification documents to get verified
                                </p>
                            </div>
                        )}

                        {profile.rejectionReason && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    <strong>Rejection Reason:</strong> {profile.rejectionReason}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Please upload new documents addressing the issues mentioned above.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Upload Documents */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Verification Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Required Documents:</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Government-issued ID (Passport, Driver's License, National ID)</li>
                                <li>Educational certificates or degrees</li>
                                <li>Teaching certifications (if applicable)</li>
                                <li>Background check or clearance (optional but recommended)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Guidelines:</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Upload clear, readable images or PDFs</li>
                                <li>Maximum file size: 5MB per file</li>
                                <li>Accepted formats: JPG, PNG, PDF</li>
                                <li>You can upload multiple files at once</li>
                            </ul>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                            </div>
                        )}

                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                <div className="text-5xl">📄</div>
                                <p className="text-sm font-medium">
                                    {selectedFiles && selectedFiles.length > 0
                                        ? `${selectedFiles.length} file(s) selected`
                                        : 'Click to select files'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    or drag and drop files here
                                </p>
                            </label>
                        </div>

                        {selectedFiles && selectedFiles.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Selected Files:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    {Array.from(selectedFiles).map((file, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <span>📎</span>
                                            <span>{file.name}</span>
                                            <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <Button
                            onClick={handleUpload}
                            disabled={uploading || !selectedFiles || selectedFiles.length === 0}
                            className="w-full"
                        >
                            {uploading ? 'Uploading...' : 'Upload & Submit for Verification'}
                        </Button>

                        {hasDocuments && (
                            <div className="mt-6 pt-6 border-t">
                                <h3 className="font-semibold mb-3">Previously Uploaded Documents:</h3>
                                <div className="space-y-2">
                                    {profile.verificationDocuments.map((url, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <span className="text-sm">Document {i + 1}</span>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline"
                                            >
                                                View →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
