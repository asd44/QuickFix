'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { BackHeader } from '@/components/BackHeader';

export default function TutorProfileDetailsPage() {
    const { userData } = useAuth();

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Custom Header - Maroon Background */}
            <div className="bg-[#5A0E24] pt-8 pb-10 relative rounded-b-[2.5rem] shadow-md">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-[#771532] to-transparent opacity-50 pointer-events-none rounded-b-[2.5rem]"></div>

                <div className="relative z-10 px-4">
                    {/* Navigation */}
                    <div className="flex items-center absolute top-8 left-4 z-20">
                        <Link href="/tutor/profile">
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 p-2 h-auto rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center mt-4">
                        <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-5xl mb-3 backdrop-blur-sm shadow-xl relative">
                            {userData.tutorProfile?.profilePicture ? (
                                <img src={userData.tutorProfile.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                            {userData.tutorProfile?.verified && (
                                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-100">
                                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white text-center">{userData.tutorProfile?.firstName} {userData.tutorProfile?.lastName}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            {userData.tutorProfile?.verified ? (
                                <Badge variant="secondary" className="!bg-green-500/20 !text-green-300 !border-green-500/30">Verified</Badge>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="!bg-red-500/20 !text-red-300 !border-red-500/30">Not Verified</Badge>
                                    <Link href="/tutor/kyc">
                                        <Button className="bg-white !text-black hover:!bg-gray-100 text-xs px-4 py-1 h-auto rounded-full font-bold shadow-md whitespace-nowrap">
                                            Complete KYC
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 -mt-4 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Details List */}
                    <div className="divide-y divide-gray-100">
                        {/* Name */}
                        <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Full Name</label>
                                <p className="font-medium text-gray-900 text-lg">{userData.tutorProfile?.firstName} {userData.tutorProfile?.lastName}</p>
                            </div>
                        </div>

                        {/* Mobile */}
                        <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Mobile Number</label>
                                <p className="font-medium text-gray-900 text-lg">{userData.phoneNumber}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Address</label>
                                <p className="font-medium text-gray-900">{userData.tutorProfile?.address || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Service Area */}
                        <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Service Area</label>
                                <p className="font-medium text-gray-900">{userData.tutorProfile?.area}, {userData.tutorProfile?.city}</p>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Bio</label>
                                <p className="font-medium text-gray-900 leading-relaxed text-sm">{userData.tutorProfile?.bio || 'No bio added yet.'}</p>
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Experience</label>
                                <p className="font-medium text-gray-900">{userData.tutorProfile?.experience} Years</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                <div className="mt-8 mb-4">
                    <Link href="/tutor/profile/edit">
                        <Button
                            variant="outline"
                            className="w-full py-6 text-base font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl transition-all"
                        >
                            Edit Profile
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
