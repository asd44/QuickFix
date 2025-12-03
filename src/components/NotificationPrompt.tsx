'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/lib/services/notification.service';
import { onMessageListener } from '@/lib/firebase/messaging';
import { Button } from './Button';
import { Card } from './Card';

export function NotificationPrompt() {
    const { user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);

            // Show prompt if permission is default and user is logged in
            if (Notification.permission === 'default' && user) {
                // Wait 3 seconds after login to show prompt
                const timer = setTimeout(() => setShowPrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [user]);

    useEffect(() => {
        // Listen for foreground messages
        if (permission === 'granted') {
            onMessageListener()
                .then((payload: any) => {
                    NotificationService.showNotification(
                        payload.notification?.title || 'New Notification',
                        payload.notification?.body || '',
                        payload.notification?.icon,
                        payload.data?.clickAction
                    );
                })
                .catch((err) => console.error('Error listening to messages:', err));
        }
    }, [permission]);

    const handleEnable = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const success = await NotificationService.enableNotifications(user.uid);
            if (success) {
                setPermission('granted');
                setShowPrompt(false);
            } else {
                alert('Failed to enable notifications. Please check browser settings.');
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for 7 days
        localStorage.setItem('notificationPromptDismissed', Date.now().toString());
    };

    // Check if dismissed recently
    useEffect(() => {
        const dismissed = localStorage.getItem('notificationPromptDismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) {
                setShowPrompt(false);
            }
        }
    }, []);

    if (!showPrompt || permission !== 'default') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Card className="p-4 shadow-lg border-2 border-primary/20">
                <div className="flex items-start gap-3">
                    <div className="text-3xl">🔔</div>
                    <div className="flex-1">
                        <h3 className="font-semibold mb-1">Enable Notifications</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Stay updated with messages, verification status, and subscription updates
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleEnable}
                                disabled={loading}
                            >
                                {loading ? 'Enabling...' : 'Enable'}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                            >
                                Not Now
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
