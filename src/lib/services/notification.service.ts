import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface AppNotification {
    id?: string;
    title: string;
    body: string;
    userId: string;
    read: boolean;
    createdAt: any;
    data?: any;
}

export class NotificationService {
    // Request permissions and register for push notifications
    static async requestPermissions(): Promise<boolean> {
        if (Capacitor.isNativePlatform()) {
            try {
                const result = await PushNotifications.requestPermissions();
                const localResult = await LocalNotifications.requestPermissions();

                if (result.receive === 'granted' || localResult.display === 'granted') {
                    await PushNotifications.register();
                    return true;
                }
            } catch (error) {
                console.error('Error requesting push permissions:', error);
            }
        } else {
            console.log('Push notifications not fully implemented for web yet');
        }
        return false;
    }

    // Show Local Notification
    static async showLocalNotification(title: string, body: string, id: number = Math.floor(Math.random() * 100000)) {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: { at: new Date(Date.now() + 100) },
                        sound: 'default',
                        attachments: undefined,
                        actionTypeId: '',
                        extra: null
                    }
                ]
            });
        } catch (error) {
            console.error('Error showing local notification:', error);
        }
    }

    // Register listeners for native push notifications
    static async registerListeners(userId: string) {
        if (!Capacitor.isNativePlatform()) return;

        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            await this.saveFcmToken(userId, token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });
    }

    // Save FCM token to user profile
    static async saveFcmToken(userId: string, token: string) {
        try {
            // Get current tokens and add new one
            const user = await FirestoreREST.getDoc<any>('users', userId);
            const currentTokens = user?.fcmTokens || [];
            if (!currentTokens.includes(token)) {
                currentTokens.push(token);
            }

            await FirestoreREST.updateDoc('users', userId, {
                fcmTokens: currentTokens,
                lastTokenUpdate: FirestoreREST.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving FCM token:', error);
        }
    }

    // Send a notification
    static async sendNotification(userId: string, title: string, body: string, data: any = {}) {
        try {
            await FirestoreREST.addDoc(`users/${userId}/notifications`, {
                title,
                body,
                read: false,
                data,
                createdAt: FirestoreREST.serverTimestamp()
            });
            console.log(`Notification sent to ${userId}: ${title}`);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Get notifications
    static async getNotifications(userId: string, limitCount: number = 20): Promise<AppNotification[]> {
        return FirestoreREST.query<AppNotification>(`users/${userId}/notifications`, {
            orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
            limit: limitCount
        });
    }

    // Polling-based listener for notifications
    static listenToNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void {
        this.getNotifications(userId).then(callback);
        const interval = setInterval(() => {
            this.getNotifications(userId).then(callback);
        }, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }

    // Mark notification as read
    static async markAsRead(userId: string, notificationId: string) {
        try {
            await FirestoreREST.updateDoc(`users/${userId}/notifications`, notificationId, {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
}
