'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { useAuth } from '@/contexts/AuthContext';

export function MobileSidebar() {
    const { user, userData, loading, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="Toggle menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    {isOpen ? (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    ) : (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    )}
                </svg>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        <Link href="/" onClick={() => setIsOpen(false)} className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            QuickFix
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-muted rounded-md"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-2">
                            <Link href="/" onClick={() => setIsOpen(false)}>
                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                    🏠 Home
                                </div>
                            </Link>

                            {loading ? (
                                <div className="px-4 py-3 text-muted-foreground">Loading...</div>
                            ) : user ? (
                                <>
                                    {/* Customer Links */}
                                    {userData?.role === 'student' && (
                                        <>
                                            <Link href="/student/dashboard" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    📊 Dashboard
                                                </div>
                                            </Link>
                                            <Link href="/student/bookings" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    📅 My Bookings
                                                </div>
                                            </Link>
                                            <Link href="/student/messages" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    💬 Messages
                                                </div>
                                            </Link>
                                        </>
                                    )}

                                    {/* Service Provider Links */}
                                    {userData?.role === 'tutor' && (
                                        <>
                                            <Link href="/tutor/dashboard" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    📊 Dashboard
                                                </div>
                                            </Link>
                                            <Link href="/tutor/bookings" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    📅 Bookings
                                                </div>
                                            </Link>
                                            <Link href="/tutor/messages" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    💬 Messages
                                                </div>
                                            </Link>
                                            <Link href="/tutor/verification" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    ✓ Verification
                                                </div>
                                            </Link>
                                            <Link href="/tutor/subscription" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    ⭐ Subscription
                                                </div>
                                            </Link>
                                            <Link href="/tutor/settings" onClick={() => setIsOpen(false)}>
                                                <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                    ⚙️ Settings
                                                </div>
                                            </Link>
                                        </>
                                    )}

                                    {/* Admin Links */}
                                    {userData?.role === 'admin' && (
                                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                                            <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                👑 Admin Panel
                                            </div>
                                        </Link>
                                    )}

                                    {/* Find Services (for customers) */}
                                    {(!userData || userData?.role === 'student') && (
                                        <Link href="/search" onClick={() => setIsOpen(false)}>
                                            <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                                🔍 Find Services
                                            </div>
                                        </Link>
                                    )}

                                    <div className="border-t border-border my-2"></div>

                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors text-red-500"
                                    >
                                        🚪 Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/search" onClick={() => setIsOpen(false)}>
                                        <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                            🔍 Find Services
                                        </div>
                                    </Link>
                                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                                        <div className="px-4 py-3 rounded-md hover:bg-muted transition-colors">
                                            🔑 Login
                                        </div>
                                    </Link>
                                    <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                                        <div className="px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center">
                                            ✨ Get Started
                                        </div>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>

                    {/* Footer */}
                    {user && userData && (
                        <div className="p-4 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                                Logged in as
                            </div>
                            <div className="font-semibold truncate">
                                {userData.studentProfile?.firstName || userData.tutorProfile?.firstName} {userData.studentProfile?.lastName || userData.tutorProfile?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {userData.role === 'student' ? '👤 Customer' : userData.role === 'tutor' ? '🔧 Provider' : '👑 Admin'}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Content Padding (to account for fixed header) */}
            <div className="h-16"></div>
        </>
    );
}
