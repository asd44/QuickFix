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

export default function StudentProfileEditPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        gender: '',
    });

    useEffect(() => {
        if (userData?.studentProfile) {
            setFormData({
                firstName: userData.studentProfile.firstName || '',
                lastName: userData.studentProfile.lastName || '',
                address: userData.studentProfile.address || '',
                city: userData.studentProfile.city || '',
                gender: userData.studentProfile.gender || '',
            });
            if (userData.studentProfile.profilePicture) {
                setPreviewUrl(userData.studentProfile.profilePicture);
            }
        }
    }, [userData]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            let profilePictureUrl = userData?.studentProfile?.profilePicture;

            if (imageFile) {
                console.log('Starting image upload...');
                // Using 'profile-pictures' path as it's likely already allowed in deployed rules
                const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                console.log('Image uploaded, getting URL...');
                profilePictureUrl = await getDownloadURL(snapshot.ref);
                console.log('Got URL:', profilePictureUrl);
            }

            const updatedData = {
                ...formData,
                profilePicture: profilePictureUrl,
            };

            console.log('Updating user profile in Firestore...');
            await UserService.updateStudentProfile(user.uid, updatedData);
            console.log('Profile updated successfully');
            router.push('/student/profile/details');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message || error.code || 'Unknown error'}`);
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
                            value={userData.phoneNumber}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500">Mobile number cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your full address"
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
                    </div>
                </form>
            </div>
        </div>
    );
}
