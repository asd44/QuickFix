'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { UserRole, User } from '@/lib/types/database';
import { FirestoreREST, NativeAuth } from '@/lib/firebase/nativeFirestore';
import { Capacitor } from '@capacitor/core';
import { Suspense } from 'react';
import { LocationPicker } from '@/components/LocationPicker';

function SignupContent() {
    const { user, userData, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read role from URL - use useSearchParams for proper Next.js handling
    const urlRole = searchParams.get('role');
    const [role, setRole] = useState<UserRole>(() => {
        // Initialize from URL param if available
        if (urlRole === 'tutor' || urlRole === 'student') {
            return urlRole;
        }
        return 'student';
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        area: '',
        coordinates: null as { latitude: number; longitude: number; } | null,
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Native Capacitor Firebase user (for when web SDK auth isn't synced)
    const [nativeUser, setNativeUser] = useState<{ uid: string; phoneNumber: string | null } | null>(null);
    const [checkingNativeAuth, setCheckingNativeAuth] = useState(Capacitor.isNativePlatform());

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Update role if URL param changes
    useEffect(() => {
        if (urlRole === 'tutor' || urlRole === 'student') {
            console.log('[SignupPage] Setting role from URL:', urlRole);
            setRole(urlRole);
        }
    }, [urlRole]);

    // Check for native Capacitor Firebase user (web SDK auth may not be synced)
    useEffect(() => {
        const checkNativeAuth = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                    const result = await FirebaseAuthentication.getCurrentUser();
                    console.log('[SignupPage] Native user check:', result);
                    if (result.user) {
                        setNativeUser({
                            uid: result.user.uid,
                            phoneNumber: result.user.phoneNumber || null
                        });
                    }
                } catch (error) {
                    console.error('[SignupPage] Native auth check error:', error);
                }
            }
            setCheckingNativeAuth(false);
        };
        checkNativeAuth();
    }, []);

    const SERVICE_CATEGORIES = [
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Painting',
        'IT Services',
        'AC Services',
        'Event Planner',
        'Interior Designing',
        'Kitchen Appliances',
        'Repairing'
    ];

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(prev => prev.filter(c => c !== category));
        } else {
            if (selectedCategories.length >= 3) {
                alert('You can select up to 3 service categories');
                return;
            }
            setSelectedCategories(prev => [...prev, category]);
        }
    };

    // Auto-detect location on mount - DISABLED per user request to prevent refresh loops
    // Users must manually click "Detect Location" if they want to use this feature.
    /*
    useEffect(() => {
        // Code removed to prevent auto-detection loops
    }, []);
    */

    const handleLocationSelect = (data: { address: string; city: string; area: string; coordinates: { latitude: number; longitude: number; } }) => {
        setFormData(prev => ({
            ...prev,
            address: data.address, // We might not have a dedicated address field in the UI shown before, but good to store
            city: data.city,
            area: data.area,
            coordinates: data.coordinates
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Use web user or native user
        const currentUser = user || nativeUser;

        if (!currentUser) {
            setError('No authenticated user found');
            setLoading(false);
            return;
        }

        if (role === 'tutor' && selectedCategories.length === 0) {
            setError('Please select at least one service category');
            setLoading(false);
            return;
        }

        // If using native user but no web SDK auth, try to sync web SDK
        if (!user && nativeUser && Capacitor.isNativePlatform()) {
            console.log('[SignupPage] No web SDK auth, attempting sync from native...');
            try {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                const { signInWithCredential, PhoneAuthProvider } = await import('firebase/auth');
                const { auth } = await import('@/lib/firebase/config');

                // Get ID token and use it to verify auth
                const idTokenResult = await FirebaseAuthentication.getIdToken();
                console.log('[SignupPage] Got ID token:', !!idTokenResult.token);

                // Wait for web SDK to pick up the auth state
                if (!auth.currentUser) {
                    console.log('[SignupPage] Waiting for web SDK auth to sync...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (auth.currentUser) {
                    console.log('[SignupPage] Web SDK auth synced successfully');
                }
            } catch (syncError) {
                console.log('[SignupPage] Web SDK sync attempt failed:', syncError);
            }
        }

        try {
            const userDoc: User = {
                uid: currentUser.uid,
                email: '', // Phone auth users don't have email
                phoneNumber: currentUser.phoneNumber || '',
                role,
                createdAt: FirestoreREST.serverTimestamp() as any,
                ...(role === 'student' && {
                    studentProfile: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        gender: '',
                        city: formData.city,
                        area: formData.area || '', // Added area
                        address: formData.address || '', // Added address
                        favorites: [],
                        coordinates: formData.coordinates || undefined,
                    },
                }),
                ...(role === 'tutor' && {
                    tutorProfile: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        bio: '',
                        subjects: selectedCategories,
                        grades: [],
                        hourlyRate: 0,
                        experience: 0,
                        teachingType: [],
                        gender: '',
                        city: formData.city,
                        area: formData.area || '', // Added area
                        address: formData.address || '', // Added address
                        verified: false,
                        verificationDocuments: [],
                        averageRating: 0,
                        totalRatings: 0,
                        profileViews: 0,
                        coordinates: formData.coordinates || undefined,
                        subscription: {
                            plan: null,
                            status: 'pending',
                            startDate: null,
                            endDate: null,
                        },
                    },
                }),
            };

            // Use FirestoreREST for profile creation (native-only)
            console.log('[SignupPage] Creating profile via REST API...');
            const success = await FirestoreREST.setDoc('users', currentUser.uid, userDoc);

            if (!success) {
                throw new Error('Failed to create profile. Please try again.');
            }

            console.log('[SignupPage] Profile created successfully!');

            // Redirect to dashboard
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Failed to create profile');
            setLoading(false);
        }
    };

    // Check if authenticated user already has a complete profile
    useEffect(() => {
        console.log('[SignupPage] useEffect:', { authLoading, hasUser: !!user, hasUserData: !!userData, hasNativeUser: !!nativeUser });
        // STRICTION CHECK: Only redirect if user has a ROLE. 
        // Simply having userData (which might be empty or incomplete) is not enough.
        if (!authLoading && user && userData?.role) {
            // User is authenticated AND has complete profile (role exists) - redirect to home
            console.log('[SignupPage] Has complete profile (role exists), redirecting to home');
            router.push('/');
        }
    }, [authLoading, user, userData, router, nativeUser]);

    // Use AuthContext as source of truth
    const effectiveUser = user;
    const isLoading = authLoading;

    console.log('[SignupPage] Render:', { authLoading, hasUser: !!user });

    // Show loading while checking auth state
    if (isLoading) {
        console.log('[SignupPage] Showing loading spinner');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // If no user at all, redirect to login
    if (!effectiveUser) {
        console.log('[SignupPage] No user found, redirecting to login');
        router.push('/auth/login');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-safe">
            {/* Full Width Header */}
            <div className={`w-full py-12 px-6 text-center ${role === 'tutor' ? 'bg-[#5A0E24]' : 'bg-[#005461]'} text-white rounded-b-[3rem] shadow-lg relative overflow-hidden`}>
                {/* Decorative background circle */}
                <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[200%] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 pt-4">
                    <h1 className="text-3xl font-bold mb-3 tracking-tight">
                        {role === 'tutor' ? 'Partner Registration' : 'Customer Registration'}
                    </h1>
                    <p className="text-white/90 text-sm max-w-xs mx-auto font-medium opacity-90 leading-relaxed">
                        {role === 'tutor' ? 'Join our professional network and start earning today.' : 'Create your account to discover and book top-rated services.'}
                    </p>
                </div>
            </div>

            {/* Content Container - Clean & Full Width */}
            <div className="w-full px-6 py-10 max-w-4xl mx-auto">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3 animate-fade-in">
                        <div className="p-2 bg-red-100 rounded-full shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleProfileCreation} className="space-y-8">
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Personal Details</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                    </div>

                    {/* Role Specific Fields */}
                    {role === 'tutor' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex justify-between items-center">
                                Services
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Select up to 3</span>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {SERVICE_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => toggleCategory(cat)}
                                        className={`relative p-2 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center text-center group h-14  shadow-sm hover:shadow-md ${selectedCategories.includes(cat)
                                            ? 'bg-[#5A0E24] text-white border-[#5A0E24] transform scale-[1.05]'
                                            : 'bg-white text-gray-600 border-gray-100 hover:border-[#5A0E24]/30 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="truncate px-3">{cat}</span>
                                        {selectedCategories.includes(cat) && (
                                            <span className="absolute top-1 right-1 bg-white/20 p-0.5 rounded-full">
                                                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {selectedCategories.length === 0 && (
                                <p className="text-sm text-amber-600 flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Please verify your expertise by selecting at least one category.
                                </p>
                            )}
                        </div>
                    )}

                    {/* City field with Auto-detect */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Location</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Your Location</label>
                            <LocationPicker
                                onLocationSelect={handleLocationSelect}
                                defaultValue=""
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 ml-1">Search your city or use GPS</p>
                        </div>

                        {/* Hidden fields for visual confirmation if needed, OR we can show them read-only */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 ml-1">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    readOnly
                                    className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-600 cursor-not-allowed"
                                    placeholder="Auto-filled"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 ml-1">Area</label>
                                <input
                                    type="text"
                                    value={formData.area}
                                    readOnly
                                    className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-600 cursor-not-allowed"
                                    placeholder="Auto-filled"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className={`w-full py-0 h-16 text-xl font-bold shadow-xl shadow-primary/20 mt-8 rounded-2xl ${role === 'tutor' ? 'bg-[#5A0E24] hover:bg-[#3d0918]' : 'bg-[#005461] hover:bg-[#003d47]'} transition-all hover:scale-[1.02] active:scale-[0.98]`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Setting up...
                            </span>
                        ) : 'Complete Profile'}
                    </Button>

                    <div className="text-center pt-8 pb-10">
                        <button
                            type="button"
                            onClick={() => {
                                router.push('/auth/role-selection');
                            }}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Not {role === 'tutor' ? 'a Service Provider' : 'a Customer'}? <span className="underline ml-1">Change Role</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
