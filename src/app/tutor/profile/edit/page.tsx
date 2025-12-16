'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { TutorService } from '@/lib/services/tutor.service';

export default function TutorProfileEditPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: userData?.tutorProfile?.firstName || '',
        lastName: userData?.tutorProfile?.lastName || '',
        address: userData?.tutorProfile?.address || '',
        area: userData?.tutorProfile?.area || '',
        city: userData?.tutorProfile?.city || '',
        bio: userData?.tutorProfile?.bio || '',
        experience: userData?.tutorProfile?.experience || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // We need to cast formData to any because updateTutorProfile expects a Partial<TutorProfile> 
            // and our local state might not perfectly match all fields yet, but it's safe here.
            await TutorService.updateTutorProfile(user.uid, {
                ...formData,
                experience: Number(formData.experience)
            });
            router.push('/tutor/profile/details');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return null;

    return (
        <div className="min-h-screen pb-20 bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-4 sticky top-0 bg-white z-10">
                <Link href="/tutor/profile/details">
                    <span className="text-2xl">←</span>
                </Link>
                <h1 className="text-xl font-bold">Edit Profile</h1>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Mobile Number</label>
                        <input
                            type="text"
                            value={userData.phoneNumber}
                            disabled
                            className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Mobile number cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your full address"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Service Area</label>
                        <input
                            type="text"
                            name="area"
                            value={formData.area}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={3}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Experience (Years)</label>
                        <input
                            type="number"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            min="0"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full py-6 text-lg"
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
