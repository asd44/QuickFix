'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';

export function AppStateHandler() {
    const router = useRouter();

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            App.addListener('appStateChange', ({ isActive }) => {
                if (isActive) {
                    console.log('App returned to foreground, refreshing data...');
                    // Force a router refresh to re-trigger data fetches that depend on route changes
                    router.refresh();

                    // You could also emit a custom event here if you have specific listeners
                    window.dispatchEvent(new Event('app-foreground'));
                }
            });
        }
    }, [router]);

    return null;
}
