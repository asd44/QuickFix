'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { CustomSelect } from '@/components/CustomSelect';
import { BackHeader } from '@/components/BackHeader';
import { UserService } from '@/lib/services/user.service';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LocationPicker } from '@/components/LocationPicker';

export default function StudentProfileEditPage() {
    const { user, userData, refreshUserData } = useAuth(); // Added refreshUserData
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        area: '',
        gender: '',
        coordinates: null as { latitude: number; longitude: number; } | null,
    });

    useEffect(() => {
        if (userData?.studentProfile) {
            setFormData({
                firstName: userData.studentProfile.firstName || '',
                lastName: userData.studentProfile.lastName || '',
                address: userData.studentProfile.address || '',
                city: userData.studentProfile.city || '',
                area: userData.studentProfile.area || '',
                gender: userData.studentProfile.gender || '',
                coordinates: userData.studentProfile.coordinates || null,
            });
            if (userData.studentProfile.profilePicture) {
                setPreviewUrl(userData.studentProfile.profilePicture);
            }
        }
    }, [userData]);

    const handleLocationSelect = (data: { address: string; city: string; area: string; coordinates: { latitude: number; longitude: number; } }) => {
        setFormData(prev => ({
            ...prev,
            address: data.address,
            city: data.city,
            area: data.area,
            coordinates: data.coordinates
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // Image compression utility
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7); // 0.7 quality
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setUploadStatus('Starting update...');

        let profilePictureUrl = userData?.studentProfile?.profilePicture;
        let imageUploadError = null;

        // 1. Try Image Upload (Independent Step)
        if (imageFile) {
            try {
                setUploadStatus('Compressing image...');
                console.log('Starting compression...');
                const compressedFile = await compressImage(imageFile);
                console.log(`Compressed: ${imageFile.size} -> ${compressedFile.size}`);

                setUploadStatus('Uploading image...');
                console.log('Starting image upload...');

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Upload timed out (60s). Connection too slow.')), 60000)
                );

                const uploadPromise = async () => {
                    const { StorageService } = await import('@/lib/services/storage.service');
                    return await StorageService.uploadProfilePicture(user.uid, compressedFile);
                };

                profilePictureUrl = await Promise.race([uploadPromise(), timeoutPromise]) as string;
                console.log('Got URL:', profilePictureUrl);

            } catch (error: any) {
                console.error('Image upload failed:', error);
                imageUploadError = error.message;
                // Don't stop here! Continue to save text data.
            }
        }

        // 2. Save Profile Data (Always Run)
        try {
            setUploadStatus('Saving details...');
            const updatedData = {
                ...formData,
                coordinates: formData.coordinates || undefined, // Fix strict type issue
                profilePicture: profilePictureUrl, // Will be new URL if success, or old URL if failed/skipped
            };

            console.log('Updating user profile in Firestore...');
            console.log('Data to save:', updatedData);

            await UserService.updateStudentProfile(user.uid, updatedData);

            // CRITICAL FIX: Refresh local state immediately
            setUploadStatus('Refreshing app data...');
            if (refreshUserData) {
                await refreshUserData();
            }

            setUploadStatus('Done!');
            console.log('Profile updated successfully');

            if (imageUploadError) {
                alert(`Profile updated, BUT image upload failed: ${imageUploadError} (Check permissions?)`);
            }

            router.push('/student/profile/details');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message || error.code || 'Unknown error'}`);
            setUploadStatus('Error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="Edit Profile" className="py-4 px-0" />

            <div className="px-4 py-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center mb-6">
                        <div
                            className="relative w-28 h-28 rounded-full bg-gray-100 mb-3 cursor-pointer ring-4 ring-gray-50 overflow-hidden"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                                    {formData.firstName?.[0] || '👤'}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium">Change</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[#005461] text-sm font-semibold"
                        >
                            Change Profile Picture
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                        <input
                            type="text"
                            value={userData.phoneNumber || ''}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500">Mobile number cannot be changed</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Location</label>
                            <LocationPicker
                                onLocationSelect={handleLocationSelect}
                                defaultValue={formData.address}
                            />
                            <p className="text-xs text-gray-500">Search your location or use GPS</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Current Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="House/Flat No, Building Name"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Area/Locality</label>
                                <input
                                    type="text"
                                    name="area"
                                    value={formData.area}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <CustomSelect
                        label="Gender"
                        value={formData.gender}
                        onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                        options={[
                            { value: 'Male', label: 'Male' },
                            { value: 'Female', label: 'Female' },
                            { value: 'Others', label: 'Others' }
                        ]}
                        placeholder="Select Gender"
                        className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 bg-gray-50 focus:bg-white"
                    />

                    <div className="pt-6">
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-semibold rounded-xl bg-[#005461] hover:bg-[#00434d] text-white shadow-lg shadow-[#005461]/20"
                            isLoading={loading}
                        >
                            Save Changes
                        </Button>
                        {uploadStatus && (
                            <p className="text-center text-sm text-gray-500 mt-2 animate-pulse">{uploadStatus}</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
