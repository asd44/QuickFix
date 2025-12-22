'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirestoreREST, NativeAuth } from '@/lib/firebase/nativeFirestore';
import { User } from '@/lib/types/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// Native user type from Capacitor Firebase
interface NativeFirebaseUser {
    uid: string;
    phoneNumber: string | null;
    displayName: string | null;
    email: string | null;
    photoUrl: string | null;
}

interface AuthContextType {
    user: NativeFirebaseUser | null;
    userData: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshUserData: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<NativeFirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load auth state on mount and listen for changes
    useEffect(() => {
        let isMounted = true;

        const loadAuthState = async () => {
            console.log('[AuthContext] Loading auth state...');

            if (!Capacitor.isNativePlatform()) {
                // On web, check for web auth
                console.log('[AuthContext] Web platform - checking web auth...');
                const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
                    if (isMounted) {
                        if (firebaseUser) {
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                phoneNumber: firebaseUser.phoneNumber,
                                displayName: firebaseUser.displayName,
                                photoUrl: firebaseUser.photoURL
                            });
                            // Load user data
                            const data = await FirestoreREST.getDoc<User>('users', firebaseUser.uid);
                            setUserData(data);
                        } else {
                            setUser(null);
                            setUserData(null);
                        }
                        setLoading(false);
                    }
                });
                return () => unsubscribe();
            }

            try {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

                // Get current user
                const nativeUser = await NativeAuth.getCurrentUser();
                console.log('[AuthContext] Native user:', nativeUser?.uid || 'none');

                if (isMounted) {
                    setUser(nativeUser as NativeFirebaseUser);
                }

                // Load user data if authenticated
                if (nativeUser) {
                    const data = await FirestoreREST.getDoc<User>('users', nativeUser.uid);
                    console.log('[AuthContext] User data loaded:', data?.role || 'none');
                    if (isMounted) {
                        setUserData(data);
                    }
                }

                // Listen for auth state changes
                FirebaseAuthentication.addListener('authStateChange', async (event) => {
                    console.log('[AuthContext] Auth state changed:', !!event.user);
                    if (isMounted) {
                        setUser(event.user as NativeFirebaseUser);

                        if (event.user) {
                            const data = await FirestoreREST.getDoc<User>('users', event.user.uid);
                            setUserData(data);
                        } else {
                            setUserData(null);
                        }
                    }
                });

            } catch (error) {
                console.error('[AuthContext] Error loading auth:', error);
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        loadAuthState();

        return () => {
            isMounted = false;
        };
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        console.log('[AuthContext] Signing in with email...');
        const credential = await signInWithEmailAndPassword(auth, email, password);

        // Set user state
        setUser({
            uid: credential.user.uid,
            email: credential.user.email,
            phoneNumber: credential.user.phoneNumber,
            displayName: credential.user.displayName,
            photoUrl: credential.user.photoURL
        });

        // Load user data
        const data = await FirestoreREST.getDoc<User>('users', credential.user.uid);
        setUserData(data);
        console.log('[AuthContext] Email sign-in successful, role:', data?.role);
    };

    const signOut = async () => {
        try {
            // Update last seen before signing out
            if (user) {
                await FirestoreREST.updateDoc('users', user.uid, {
                    lastSeen: FirestoreREST.serverTimestamp(),
                    isOnline: false
                });
            }

            // Sign out from both native and web
            if (Capacitor.isNativePlatform()) {
                await NativeAuth.signOut();
            }
            await auth.signOut();

            setUser(null);
            setUserData(null);
        } catch (error) {
            console.error('[AuthContext] Sign out error:', error);
        }
    };

    const refreshUserData = async () => {
        if (user) {
            const data = await FirestoreREST.getDoc<User>('users', user.uid);
            setUserData(data);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, signOut, refreshUserData, signInWithEmail }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

