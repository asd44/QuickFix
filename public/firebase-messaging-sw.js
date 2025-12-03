// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyCAOSo7Adz8GP1ugCrfYqYZsp9K8Q6K35I",
    authDomain: "quickfix-v1.firebaseapp.com",
    projectId: "quickfix-v1",
    storageBucket: "quickfix-v1.firebasestorage.app",
    messagingSenderId: "739661928860",
    appId: "1:739661928860:web:45be650be9cf42a9e49059"
});

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title || 'TutorLink';
    const notificationOptions = {
        body: payload.notification.body || '',
        icon: payload.notification.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received:', event);

    event.notification.close();

    // Get the click action URL from notification data
    const clickAction = event.notification.data?.clickAction || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url === clickAction && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(clickAction);
                }
            })
    );
});
