'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App as CapacitorApp } from '@capacitor/app';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

export function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const [showExitModal, setShowExitModal] = useState(false);

    useEffect(() => {
        let backListener: any;

        const setupListener = async () => {
            backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                if (showExitModal) {
                    // If modal is open, back button closes it
                    setShowExitModal(false);
                    return;
                }

                // Define exit routes (roots of your navigation stacks)
                const exitRoutes = [
                    '/',
                    '/auth/login',
                    '/auth/signup',
                    '/student/home', // Assuming this is student dashboard
                    '/tutor/view',   // Assuming this is tutor dashboard
                    '/tutor/profile',
                    '/student/profile'
                ];

                // Check if current path is an exit route
                // logic: exact match or maybe checks if it's a "tab" root
                const isExitRoute = exitRoutes.includes(pathname || '');

                if (isExitRoute) {
                    // Show exit confirmation
                    setShowExitModal(true);
                } else {
                    // Go back in history
                    router.back();
                }
            });
        };

        setupListener();

        return () => {
            if (backListener) {
                backListener.remove();
            }
        };
    }, [pathname, showExitModal, router]);

    if (!showExitModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-sm border-none shadow-2xl bg-white overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5A0E24] to-[#005461]" />
                <CardHeader className="text-center pt-8 pb-2">
                    <CardTitle className="text-xl font-bold text-gray-900">Exit App?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                    <p className="text-center text-gray-500">
                        Are you sure you want to close the application?
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
                            onClick={() => setShowExitModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-[#5A0E24] hover:bg-[#450a1b] text-white shadow-lg shadow-[#5A0E24]/20"
                            onClick={() => CapacitorApp.exitApp()}
                        >
                            Close App
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
