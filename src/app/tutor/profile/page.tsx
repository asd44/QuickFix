'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

export default function TutorMenuPage() {
    const { userData, signOut, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!userData) {
        router.push('/auth/login');
        return null;
    }

    const menuItems = [
        {
            label: 'Profile',
            href: '/tutor/profile/details',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            label: 'My Bookings',
            href: '/tutor/bookings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            label: 'Reviews',
            href: '/tutor/reviews',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            )
        },
        {
            label: 'My Subscription',
            href: '/tutor/profile/subscription',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            )
        },
        {
            label: 'KYC Status',
            href: '/tutor/kyc',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            label: 'About Us',
            href: '/about',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            label: 'FAQ',
            href: '/faq',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            label: 'Terms & Conditions',
            href: '/terms',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            label: 'Privacy Policy',
            href: '/privacy',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )
        },
        {
            label: 'Contact Us',
            href: '/contact',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header Section - Maroon Background */}
            <div className="bg-[#5A0E24] pt-12 pb-8 flex flex-col items-center justify-center relative rounded-b-[2.5rem] shadow-md">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-[#771532] to-transparent opacity-50 pointer-events-none rounded-b-[2.5rem]"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-4xl mb-4 backdrop-blur-sm">
                        {userData.tutorProfile?.profilePicture ? (
                            <img src={userData.tutorProfile.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-1">{userData.tutorProfile?.firstName} {userData.tutorProfile?.lastName}</h1>
                    <p className="text-white/80 font-medium text-sm">{userData.phoneNumber}</p>
                </div>
            </div>

            {/* Menu Options - Clean List Style */}
            <div className="px-4 mt-6 space-y-1">
                {menuItems.map((item, index) => (
                    <Link key={index} href={item.href}>
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group rounded-xl">
                            <div className="flex items-center gap-4">
                                <span className="text-xl text-gray-700 w-6 flex justify-center">{item.icon}</span>
                                <span className="font-medium text-[15px] text-gray-900">{item.label}</span>
                            </div>
                            <span className="text-gray-400 text-lg group-hover:text-gray-600 group-hover:translate-x-1 transition-all">›</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Logout Button */}
            <div className="p-4 mt-8 mb-4">
                <Button
                    variant="outline"
                    className="w-full py-6 text-base font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl transition-all"
                    onClick={async () => {
                        await signOut();
                        router.push('/auth/login');
                    }}
                >
                    Logout
                </Button>
            </div>
        </div>
    );
}
