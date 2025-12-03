'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';

// Get admin secret key from environment variable
const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

export default function CreateAdminPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        secretKey: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate secret key
        if (formData.secretKey !== ADMIN_SECRET_KEY) {
            setError('Invalid admin secret key. Access denied.');
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // Create admin user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                role: 'admin',
                createdAt: serverTimestamp(),
                adminProfile: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                },
            });

            // Redirect to admin dashboard
            router.push('/admin');
        } catch (err: any) {
            console.error('Error creating admin:', err);

            // Handle specific Firebase errors
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use. Try a different email.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Use a stronger password.');
            } else {
                setError('Failed to create admin account. ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 to-accent/5">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">
                        🔐 Create Admin Account
                    </CardTitle>
                    <p className="text-center text-sm text-muted-foreground mt-2">
                        QuickFix Service Marketplace
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) =>
                                    setFormData({ ...formData, firstName: e.target.value })
                                }
                                className="w-full p-3 border rounded-md bg-background"
                                placeholder="John"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) =>
                                    setFormData({ ...formData, lastName: e.target.value })
                                }
                                className="w-full p-3 border rounded-md bg-background"
                                placeholder="Doe"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full p-3 border rounded-md bg-background"
                                placeholder="admin@quickfix.in"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full p-3 border rounded-md bg-background"
                                placeholder="Minimum 6 characters"
                                minLength={6}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                className="w-full p-3 border rounded-md bg-background"
                                placeholder="Re-enter password"
                            />
                        </div>

                        {/* Admin Secret Key */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-red-600">
                                🔑 Admin Secret Key
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.secretKey}
                                onChange={(e) =>
                                    setFormData({ ...formData, secretKey: e.target.value })
                                }
                                className="w-full p-3 border-2 border-red-200 rounded-md bg-background focus:border-red-500"
                                placeholder="Enter secret key"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Contact your system administrator for the secret key
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
                        </Button>

                        {/* Info Box */}
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                                <strong>Security Notice:</strong> This page creates admin accounts with full platform access.
                                The secret key is configured in your <code>.env.local</code> file as <code>NEXT_PUBLIC_ADMIN_SECRET_KEY</code>.
                                Change this key in production and keep it confidential!
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
