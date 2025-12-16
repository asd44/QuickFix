'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/lib/services/user.service';

export default function LocationSelectionPage() {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [useCurrentLocationLoading, setUseCurrentLocationLoading] = useState(false);
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Get user location on mount for better suggestions
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            }, () => {
                // Ignore errors, just don't bias search
            });
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Fetch autocomplete suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            // Trim and require at least 3 chars
            if (!debouncedSearchText || debouncedSearchText.length < 3) {
                setSuggestions([]);
                return;
            }

            const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
            if (!apiKey) {
                console.warn('Geoapify API Key missing');
                return;
            }

            try {
                // Base URL with India filter (Always applied)
                let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(debouncedSearchText)}&apiKey=${apiKey}&filter=countrycode:in&limit=20`;

                const response = await fetch(url);
                const data = await response.json();
                if (data.features) {
                    setSuggestions(data.features);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        };

        fetchSuggestions();
    }, [debouncedSearchText]);

    const handleSelectSuggestion = async (feature: any) => {
        const { properties, geometry } = feature;
        const [lon, lat] = geometry.coordinates;

        let city = properties.city || properties.town || properties.village || properties.county || searchText.split(',')[0];
        const address = properties.formatted;

        setSearchText(address);
        setSuggestions([]); // Clear suggestions

        if (user) {
            setLoading(true);
            try {
                await UserService.updateStudentProfile(user.uid, {
                    address: address,
                    city: city,
                    coordinates: { latitude: lat, longitude: lon }
                });
                router.back();
            } catch (error) {
                console.error('Error saving location:', error);
                alert('Failed to save location');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUseCurrentLocation = async () => {
        if (!user) {
            alert('Please login to use this feature');
            return;
        }

        setUseCurrentLocationLoading(true);

        try {
            // Import dynamically to avoid SSR issues
            const { Geolocation } = await import('@capacitor/geolocation');

            // Check permissions
            let permissionStatus = await Geolocation.checkPermissions();

            if (permissionStatus.location !== 'granted') {
                const requestStatus = await Geolocation.requestPermissions();
                if (requestStatus.location !== 'granted') {
                    alert('Location permission denied. Please enable it in app settings.');
                    setUseCurrentLocationLoading(false);
                    return;
                }
            }

            // Get current position
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000
            });
            const { latitude, longitude } = position.coords;

            const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

            if (!apiKey) {
                alert('Configuration Error: API Key missing');
                setUseCurrentLocationLoading(false);
                return;
            }

            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${apiKey}`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const properties = data.features[0].properties;
                const address = properties.formatted;
                const city = properties.city || properties.town || properties.village || "Current Location";

                await UserService.updateStudentProfile(user.uid, {
                    address: address,
                    city: city,
                    coordinates: { latitude, longitude }
                });
                router.back();
            } else {
                alert('Could not determine address from location');
            }
        } catch (error: any) {
            console.error('Geolocation error:', error);
            let msg = 'Unable to retrieve location.';
            if (error.message) msg = error.message;
            alert(msg);
        } finally {
            setUseCurrentLocationLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <BackHeader title="Select Location" />

            <div className="p-4 space-y-6">
                {/* Search Bar with Autocomplete */}
                <div className="relative" ref={wrapperRef}>
                    <input
                        type="text"
                        placeholder="Search for area, street name..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        autoFocus
                    />
                    <svg
                        className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {suggestions.map((feature, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleSelectSuggestion(feature)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-start gap-3"
                                >
                                    <svg className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-900 line-clamp-1">
                                            {feature.properties.formatted}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Warning if no API KEY */}
                {!process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY && (
                    <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                        ⚠️ Geoapify API Key is missing. Search will not work.
                    </div>
                )}

                {/* Current Location Option */}
                <button
                    onClick={handleUseCurrentLocation}
                    disabled={useCurrentLocationLoading}
                    className="w-full flex items-center gap-4 p-4 text-left border rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                        {useCurrentLocationLoading ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-red-600">Use my current location</h3>
                        <p className="text-sm text-gray-500">Using GPS & Geoapify</p>
                    </div>
                </button>

                {/* Saved/Recent Locations (Mock for visual) */}
                <div className="pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Saved Locations</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-gray-600">
                            <svg className="w-5 h-5 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <div>
                                <h4 className="font-medium text-gray-900">Home</h4>
                                <p className="text-sm text-gray-500">{userData?.studentProfile?.address || 'No home address saved'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
