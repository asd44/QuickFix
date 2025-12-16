'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { RoleSelectionCard } from '@/components/RoleSelectionCard';

export default function WelcomePage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<'student' | 'tutor'>('student');

    const handleSignIn = () => {
        router.push(`/auth/login?role=${selectedRole}`);
    };

    return (
        <div className="min-h-screen bg-white px-6 pt-12 pb-8 flex flex-col items-center justify-between">
            <div className="w-full max-w-sm space-y-8">
                <div className="flex justify-between items-center w-full mb-8">
                    {/* Space for status bar if needed */}
                </div>

                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-8">
                        Welcome back.
                    </h1>

                    <div className="space-y-4">
                        <RoleSelectionCard
                            title="I am a Customer"
                            subtitle="Book services"
                            selected={selectedRole === 'student'}
                            onClick={() => setSelectedRole('student')}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            }
                        />

                        <RoleSelectionCard
                            title="I am a Service Provider"
                            subtitle="Get jobs & earn"
                            selected={selectedRole === 'tutor'}
                            onClick={() => setSelectedRole('tutor')}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-sm">
                <Button
                    onClick={handleSignIn}
                    className="w-full bg-[#1A1F36] hover:bg-[#2e3552] text-white py-6 text-lg rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                >
                    Sign In
                </Button>
            </div>
        </div>
    );
}
