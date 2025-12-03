'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, UserRole } from '@/lib/types/database';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    signUp: (email: string, password: string, role: UserRole, additionalData: any) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch user data from Firestore with error handling
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data() as User);
                    } else {
                        // User document doesn't exist yet
                        setUserData(null);
                    }
                } catch (error) {
                    // Handle Firestore permission errors gracefully
                    console.warn('Could not fetch user data from Firestore:', error);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signUp = async (
        email: string,
        password: string,
        role: UserRole,
        additionalData: any
    ) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;

        // Send email verification
        await sendEmailVerification(user);

        // Create user document in Firestore
        const userDoc: User = {
            uid: user.uid,
            email: user.email!,
            role,
            createdAt: serverTimestamp() as any,
            ...(role === 'student' && {
                studentProfile: {
                    firstName: additionalData.firstName,
                    lastName: additionalData.lastName,
                    grade: additionalData.grade,
                    city: additionalData.city,
                    favorites: [],
                },
            }),
            ...(role === 'tutor' && {
                tutorProfile: {
                    firstName: additionalData.firstName,
                    lastName: additionalData.lastName,
                    bio: '',
                    subjects: [],
                    grades: [],
                    hourlyRate: 0,
                    experience: 0,
                    teachingType: [],
                    gender: additionalData.gender || '',
                    city: additionalData.city || '',
                    area: additionalData.area || '',
                    verified: false,
                    verificationDocuments: [],
                    averageRating: 0,
                    totalRatings: 0,
                    profileViews: 0,
                    subscription: {
                        plan: null,
                        status: 'pending',
                        startDate: null,
                        endDate: null,
                    },
                },
            }),
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);
        setUserData(userDoc);
    };

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const { user } = userCredential;

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // Create new user document (default to student)
            const newUserDoc: User = {
                uid: user.uid,
                email: user.email!,
                role: 'student',
                createdAt: serverTimestamp() as any,
                studentProfile: {
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ')[1] || '',
                    grade: '',
                    city: '',
                    favorites: [],
                },
            };

            await setDoc(doc(db, 'users', user.uid), newUserDoc);
            setUserData(newUserDoc);
        }
    };

    const signOut = async () => {
        try {
            // Try to update user's online status, but don't fail if permissions are missing
            if (user) {
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        lastSeen: serverTimestamp(),
                        isOnline: false
                    });
                } catch (firestoreError) {
                    // Silently ignore Firestore errors during signout
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

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        userData,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
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
