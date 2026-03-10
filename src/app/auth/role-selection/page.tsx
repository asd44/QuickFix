'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { RoleSelectionCard } from '@/components/RoleSelectionCard';

export default function RoleSelectionPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<'student' | 'tutor'>('student');

    const handleContinue = () => {
        router.push(`/auth/signup?role=${selectedRole}`);
    };

    return (
        <div className="min-h-screen bg-white px-6 pt-12 pb-8 flex flex-col items-center justify-between">
            <div className="w-full max-w-sm space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                        Who are you?
                    </h1>
                    <p className="text-slate-500 mb-8">
                        Choose your role to get started with QuickFix.
                    </p>

                    <div className="space-y-4">
                        <RoleSelectionCard
                            title="I am a Customer"
                            subtitle="Book services for your home"
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
                            subtitle="Find jobs & grow your business"
                            selected={selectedRole === 'tutor'}
                            onClick={() => setSelectedRole('tutor')}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-sm">
                <Button
                    onClick={handleContinue}
                    className="w-full bg-[#1A1F36] hover:bg-[#2e3552] text-white py-6 text-lg rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
