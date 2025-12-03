'use client';

import Link from 'next/link';
import { Button } from './Button';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
    const { user, userData, loading, signOut } = useAuth();

    return (
        <nav className="glass sticky top-0 z-50 border-b border-border/40">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        QuickFix
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-sm hover:text-primary transition-colors">
                            Home
                        </Link>

                        {/* Auth Buttons */}
                        {loading ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : user && userData ? (
                            <div className="flex items-center gap-4">
                                {userData.role === 'student' && (
                                    <>
                                        <Link href="/student/dashboard" className="text-sm hover:text-primary transition-colors">
                                            Dashboard
                                        </Link>
                                        <Link href="/search" className="text-sm hover:text-primary transition-colors">
                                            Find Services
                                        </Link>
                                    </>
                                )}

                                {userData.role === 'tutor' && (
                                    <>
                                        <Link href="/tutor/dashboard" className="text-sm hover:text-primary transition-colors">
                                            Dashboard
                                        </Link>
                                        <Link href="/tutor/settings" className="text-sm hover:text-primary transition-colors">
                                            Settings
                                        </Link>
                                    </>
                                )}

                                {userData.role === 'admin' && (
                                    <Link href="/admin" className="text-sm hover:text-primary transition-colors">
                                        Admin Panel
                                    </Link>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {userData.studentProfile?.firstName || userData.tutorProfile?.firstName}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => signOut()}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/auth/login">
                                    <Button variant="ghost" size="sm">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button size="sm">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
