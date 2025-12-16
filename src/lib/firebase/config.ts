// Firebase Web SDK Configuration (Client-side)
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: Messaging | undefined;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Messaging is only supported in browser environments
    if (typeof window !== 'undefined') {
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.warn('Firebase Messaging failed to initialize', e);
        }
    }
} else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    if (typeof window !== 'undefined') {
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.warn('Firebase Messaging failed to initialize', e);
        }
    }
}

export { app, auth, db, storage, messaging };
