'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import OTPLogin from '@/components/auth/OTPLogin';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Welcome to QuickFix</CardTitle>
                    <p className="text-center text-muted-foreground">Sign in or Sign up with your phone</p>
                </CardHeader>
                <CardContent>
                    <OTPLogin />
                    <div className="mt-6 text-center border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Are you an administrator?</p>
                        <Link href="/auth/admin/login" className="text-sm font-medium text-primary hover:underline">
                            Admin Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
