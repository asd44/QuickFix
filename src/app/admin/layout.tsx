'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userData, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/auth/login');
        } catch (error) {
            console.error('Failed to sign out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            {pathname === '/admin' && (
                <header className="border-b border-gray-800 bg-[#0f172a] text-white sticky top-0 z-30 shadow-md">
                    <div className="w-full px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                                <p className="text-sm text-gray-400 mt-1 font-medium">
                                    {userData?.email}
                                </p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>
            )}
            <main>
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className="grid grid-cols-3 h-full">
                    <Link
                        href="/admin"
                        className={`flex flex-col items-center justify-center hover:bg-gray-50 transition-colors ${pathname === '/admin' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="text-xs font-medium">Dashboard</span>
                    </Link>
                    <Link
                        href="/admin/subscriptions"
                        className={`flex flex-col items-center justify-center hover:bg-gray-50 transition-colors ${pathname === '/admin/subscriptions' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="text-xs font-medium">Subscriptions</span>
                    </Link>
                    <Link
                        href="/admin/appeals"
                        className={`flex flex-col items-center justify-center hover:bg-gray-50 transition-colors ${pathname === '/admin/appeals' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs font-medium">Appeals</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
