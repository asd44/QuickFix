import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { requestNotificationPermission as getFCMToken } from '@/lib/firebase/messaging';

export class NotificationService {
    // Request permission and save FCM token to user document
    static async enableNotifications(userId: string): Promise<boolean> {
        try {
            const token = await getFCMToken();

            if (!token) {
                return false;
            }

            // Save token to user document
            await updateDoc(doc(db, 'users', userId), {
                fcmTokens: arrayUnion(token),
                'notificationSettings.enabled': true,
            });

            return true;
        } catch (error) {
            console.error('Error enabling notifications:', error);
            return false;
        }
    }

    // Remove FCM token from user document
    static async disableNotifications(userId: string, token: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'users', userId), {
                fcmTokens: arrayRemove(token),
            });
        } catch (error) {
            console.error('Error disabling notifications:', error);
        }
    }

    // Update notification settings
    static async updateNotificationSettings(
        userId: string,
        settings: {
            messages?: boolean;
            verifications?: boolean;
            subscriptions?: boolean;
            admin?: boolean;
        }
    ): Promise<void> {
        try {
            const updates: any = {};

            if (settings.messages !== undefined) {
                updates['notificationSettings.messages'] = settings.messages;
            }
            if (settings.verifications !== undefined) {
                updates['notificationSettings.verifications'] = settings.verifications;
            }
            if (settings.subscriptions !== undefined) {
                updates['notificationSettings.subscriptions'] = settings.subscriptions;
            }
            if (settings.admin !== undefined) {
                updates['notificationSettings.admin'] = settings.admin;
            }

            await updateDoc(doc(db, 'users', userId), updates);
        } catch (error) {
            console.error('Error updating notification settings:', error);
        }
    }

    // Show browser notification (when app is open)
    static showNotification(title: string, body: string, icon?: string, clickUrl?: string) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: icon || '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'tutorlink-notification',
                requireInteraction: false,
            });

            if (clickUrl) {
                notification.onclick = () => {
                    window.focus();
                    window.location.href = clickUrl;
                    notification.close();
                };
            }

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
    }
}
