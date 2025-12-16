'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';

export default function StudentMenuPage() {
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
            href: '/student/profile/details',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        },

        {
            label: 'Reviews',
            href: '/student/reviews',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
        },
        {
            label: 'About Us',
            href: '/about',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        {
            label: 'FAQ',
            href: '/faq',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        {
            label: 'Terms & Conditions',
            href: '/terms',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        },
        {
            label: 'Privacy Policy',
            href: '/privacy',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        },
        {
            label: 'Contact Us',
            href: '/contact',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
        }
    ];

    return (
        <div className="min-h-screen pb-16 bg-white">
            {/* Header with Name - Teal Style - Full Width */}
            <div className="bg-[#005461] px-4 py-6 shadow-sm mb-2">
                <h1 className="text-2xl font-bold text-white">{userData.studentProfile?.firstName} {userData.studentProfile?.lastName}</h1>
                <p className="text-white/80 text-sm mt-1">{userData.phoneNumber}</p>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 gap-3 px-4 py-4 border-b border-gray-100">
                <Link href="/student/bookings" className="rounded-2xl p-4 flex flex-col items-start gap-4 hover:opacity-90 transition-opacity bg-gradient-to-br from-[#005461] to-[#002025] shadow-sm">
                    <div className="w-6 h-6 text-white">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <span className="font-semibold text-sm text-white leading-tight">My<br />bookings</span>
                </Link>
                <Link href="/contact" className="rounded-2xl p-4 flex flex-col items-start gap-4 hover:opacity-90 transition-opacity bg-gradient-to-br from-[#005461] to-[#002025] shadow-sm">
                    <div className="w-6 h-6 text-white">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <span className="font-semibold text-sm text-white leading-tight">Help &<br />support</span>
                </Link>
            </div>

            {/* Menu List */}
            <div className="py-2 px-4">
                {menuItems.map((item, index) => (
                    <Link key={index} href={item.href} className="block w-full">
                        <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-0 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-800 group-hover:text-primary transition-colors">{item.icon}</span>
                                <span className="font-medium text-base text-gray-800">{item.label}</span>
                            </div>
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Refer Section */}
            <div className="px-4 my-6">
                <div className="bg-[#f3f0ff] rounded-xl p-4 flex items-center justify-between border border-[#e9e6fd]">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Refer & earn ₹100</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-3 leading-tight max-w-[200px]">Get ₹100 when your friend completes their first booking</p>
                        <Button className="bg-[#6e42e5] hover:bg-[#5b35c4] text-white rounded-lg px-6 h-9 text-sm font-medium">
                            Refer now
                        </Button>
                    </div>
                    <div className="text-4xl pr-2">🎁</div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="px-4 mt-8 mb-8">
                <button
                    onClick={async () => {
                        await signOut();
                        router.push('/auth/login');
                    }}
                    className="w-full py-3.5 border border-red-100 text-red-600 bg-white rounded-xl font-medium text-lg hover:bg-red-50 transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
