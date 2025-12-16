'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User } from '@/lib/types/database';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    verifyOTP: (otp: string) => Promise<boolean>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Subscribe to user document changes
                const unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setUserData(docSnapshot.data() as User);

                        // Initialize Notifications
                        import('@/lib/services/notification.service').then(async ({ NotificationService }) => {
                            // 1. Request permissions (Native only)
                            await NotificationService.requestPermissions();

                            // 2. Register listeners (Native only)
                            NotificationService.registerListeners(firebaseUser.uid);

                            // 3. Listen to Firestore notifications (In-App)
                            NotificationService.listenToNotifications(firebaseUser.uid, (notifications) => {
                                console.log('Received in-app notifications:', notifications);
                                // You could update a global notification state here if needed
                            });
                        });
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.warn('Could not fetch user data from Firestore:', error);
                    setUserData(null);
                    setLoading(false);
                });

                // Cleanup subscription on auth state change or unmount
                return () => {
                    unsubscribeUser();
                };
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const signOut = async () => {
        try {
            if (user) {
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        lastSeen: serverTimestamp(),
                        isOnline: false
                    });
                } catch (firestoreError) {
                    console.warn('Could not update user status during signout:', firestoreError);
                }
            }
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing in with email:', error);
            throw error;
        }
    };

    const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
        try {
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(confirmation);
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw error;
        }
    };

    const verifyOTP = async (otp: string): Promise<boolean> => {
        if (!confirmationResult) {
            throw new Error('No OTP request found');
        }
        try {
            const result = await confirmationResult.confirm(otp);
            const user = result.user;

            // Check if user document exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                setUserData(userDoc.data() as User);
                return true; // User exists
            } else {
                return false; // User is new
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            throw error;
        }
    };

    const value = {
        user,
        userData,
        loading,
        signOut,
        signInWithPhone,
        signInWithEmail,
        verifyOTP,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
