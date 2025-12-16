'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { CustomSelect } from '@/components/CustomSelect';
import { UserRole, User } from '@/lib/types/database';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function SignupPage() {
    const { user, userData, loading: authLoading, signOut } = useAuth();
    const router = useRouter();

    const [role, setRole] = useState<UserRole>('student');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [city, setCity] = useState('');
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const initialRole = params.get('role');
        if (initialRole === 'tutor' || initialRole === 'student') {
            setRole(initialRole);
        } else {
            // Fallback if no role is picked
            setRole('student');
        }
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

    // Auto-detect location on mount
    useEffect(() => {
        detectLocation();
    }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setDetectingLocation(true);
        setError('');

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            setCoordinates({ latitude, longitude });

            try {
                // Reverse geocoding using OpenStreetMap Nominatim
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();

                if (data.address) {
                    const detectedCity = data.address.city || data.address.town || data.address.village || data.address.state_district || '';
                    if (detectedCity) {
                        setCity(detectedCity);
                    }
                }
            } catch (err) {
                console.warn('Failed to detect city name:', err);
            } finally {
                setDetectingLocation(false);
            }
        }, (err) => {
            console.error('Geolocation error:', err);
            setDetectingLocation(false);
        });
    };

    const handleProfileCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!user) {
            setError('No authenticated user found');
            setLoading(false);
            return;
        }

        if (role === 'tutor' && selectedCategories.length === 0) {
            setError('Please select at least one service category');
            setLoading(false);
            return;
        }

        try {
            const userDoc: User = {
                uid: user.uid,
                email: '', // Phone auth users don't have email
                phoneNumber: user.phoneNumber || '',
                role,
                createdAt: serverTimestamp() as any,
                ...(role === 'student' && {
                    studentProfile: {
                        firstName,
                        lastName,
                        gender,
                        city,
                        favorites: [],
                        coordinates: coordinates || undefined,
                    },
                }),
                ...(role === 'tutor' && {
                    tutorProfile: {
                        firstName,
                        lastName,
                        bio: '',
                        subjects: selectedCategories, // Use selected categories
                        grades: [],
                        hourlyRate: 0,
                        experience: 0,
                        teachingType: [],
                        gender: '', // Removed from form
                        city,
                        area: '', // Removed from form
                        verified: false,
                        verificationDocuments: [],
                        averageRating: 0,
                        totalRatings: 0,
                        profileViews: 0,
                        coordinates: coordinates || undefined,
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

            // Redirect to dashboard
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create profile');
            setLoading(false);
        }
    };

    if (authLoading || !user) {
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
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>
                        {role === 'student' && (
                            <CustomSelect
                                label="Gender"
                                value={gender}
                                onChange={(val) => setGender(val)}
                                options={[
                                    { value: 'Male', label: 'Male' },
                                    { value: 'Female', label: 'Female' },
                                    { value: 'Others', label: 'Others' }
                                ]}
                                placeholder="Select Gender"
                                className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg"
                            />
                        )}
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
                            <label className="text-sm font-semibold text-gray-700 ml-1">Your City</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full pl-12 h-14 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                                        placeholder="e.g., Mumbai"
                                        required
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={detectLocation}
                                    disabled={detectingLocation}
                                    className="whitespace-nowrap px-6 border-gray-200 hover:bg-gray-50 hover:text-primary rounded-xl h-14"
                                >
                                    {detectingLocation ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium">Detect Location</span>
                                    )}
                                </Button>
                            </div>
                            {coordinates && (
                                <p className="text-sm text-emerald-600 flex items-center gap-2 font-medium animate-fade-in bg-emerald-50 p-2 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    GPS Coordinates captured
                                </p>
                            )}
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
                                signOut();
                                router.push('/welcome');
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
