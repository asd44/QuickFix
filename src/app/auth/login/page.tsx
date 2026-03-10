'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import OTPLogin from '@/components/auth/OTPLogin';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
                <OTPLogin />
            </div>
        </div>
    );
}
