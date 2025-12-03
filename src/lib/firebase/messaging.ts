import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './config';

let messaging: Messaging | null = null;

// Initialize messaging only in browser
if (typeof window !== 'undefined') {
    try {
        messaging = getMessaging(app);
    } catch (error) {
        console.error('Error initializing Firebase Messaging:', error);
    }
}

export { messaging };

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
    try {
        if (!messaging) {
            console.error('Messaging not initialized');
            return null;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            console.log('FCM Token:', token);
            return token;
        } else {
            console.log('Notification permission denied');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

// Listen for foreground messages
export function onMessageListener() {
    return new Promise((resolve) => {
        if (!messaging) {
            console.error('Messaging not initialized');
            return;
        }

        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            resolve(payload);
        });
    });
}
