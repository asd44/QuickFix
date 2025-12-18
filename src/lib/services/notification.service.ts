import { db } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
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
                // Request Push Permissions
                const result = await PushNotifications.requestPermissions();

                // Request Local Notification Permissions
                const localResult = await LocalNotifications.requestPermissions();

                if (result.receive === 'granted' || localResult.display === 'granted') {
                    await PushNotifications.register();
                    return true;
                }
            } catch (error) {
                console.error('Error requesting push permissions:', error);
            }
        } else {
            // Web handling (optional, requires service worker)
            console.log('Push notifications not fully implemented for web yet');
        }
        return false;
    }

    // Show Local Notification (Bridge for missing backend)
    static async showLocalNotification(title: string, body: string, id: number = Math.floor(Math.random() * 100000)) {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: { at: new Date(Date.now() + 100) }, // Immediate
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

        // On registration success
        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            await this.saveFcmToken(userId, token.value);
        });

        // On registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        // On notification received in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
            // You can show a local toast or update UI here
        });

        // On notification tapped
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
            // Handle navigation based on data
        });
    }

    // Save FCM token to user profile
    static async saveFcmToken(userId: string, token: string) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                lastTokenUpdate: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving FCM token:', error);
        }
    }

    // Send a notification (Simulated by writing to Firestore)
    // In a real app, this would be done via Cloud Functions
    static async sendNotification(userId: string, title: string, body: string, data: any = {}) {
        try {
            // 1. Write to user's notification collection (for in-app list)
            await addDoc(collection(db, 'users', userId, 'notifications'), {
                title,
                body,
                read: false,
                data,
                createdAt: serverTimestamp()
            });

            // 2. (Optional) If we had Cloud Functions, writing here could trigger a real FCM push
            console.log(`Notification sent to ${userId}: ${title}`);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Listen to notifications (for in-app display)
    static listenToNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
        const q = query(
            collection(db, 'users', userId, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AppNotification));
            callback(notifications);
        });
    }

    // Mark notification as read
    static async markAsRead(userId: string, notificationId: string) {
        try {
            await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
}
