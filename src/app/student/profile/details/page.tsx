'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { BackHeader } from '@/components/BackHeader';

export default function StudentProfileDetailsPage() {
    const { userData } = useAuth();

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="Personal Details" className="py-4 px-0" />

            <div className="px-4">
                {/* Avatar Section */}
                <div className="flex flex-col items-center py-8">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#005461] to-[#002025] flex items-center justify-center text-5xl text-white shadow-lg mb-4 ring-4 ring-white overflow-hidden">
                        {userData.studentProfile?.profilePicture ? (
                            <img
                                src={userData.studentProfile.profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            userData.studentProfile?.firstName?.[0] || '👤'
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {userData.studentProfile?.firstName} {userData.studentProfile?.lastName}
                    </h2>
                    <p className="text-gray-500 font-medium">{userData.phoneNumber}</p>
                </div>

                {/* Details Card */}
                <div className="bg-gray-50 rounded-3xl p-6 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div className="flex-1 border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                            <label className="text-xs font-bold text-[#005461] uppercase tracking-wider block mb-1">Address</label>
                            <p className="font-medium text-gray-900 leading-relaxed">
                                {userData.studentProfile?.address || 'Not provided'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div className="flex-1 border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                            <label className="text-xs font-bold text-[#005461] uppercase tracking-wider block mb-1">City</label>
                            <p className="font-medium text-gray-900">{userData.studentProfile?.city || 'Not provided'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-[#005461] uppercase tracking-wider block mb-1">Gender</label>
                            <p className="font-medium text-gray-900">{userData.studentProfile?.gender || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                <div className="mt-8">
                    <Link href="/student/profile/edit">
                        <Button className="w-full h-14 text-lg font-semibold rounded-xl bg-[#005461] hover:bg-[#00434d] text-white shadow-lg shadow-[#005461]/20">
                            Edit Profile
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
