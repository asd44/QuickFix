'use client';

import { useState, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Geolocation as CapacitorGeolocation } from '@capacitor/geolocation';
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from 'use-places-autocomplete';
import { Button } from './Button';

interface LocationData {
    address: string;
    city: string;
    area: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

interface LocationPickerProps {
    onLocationSelect: (data: LocationData) => void;
    defaultValue?: string;
    className?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export const LocationPicker = ({ onLocationSelect, defaultValue = '', className = '' }: LocationPickerProps) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    if (loadError) {
        return (
            <div className="text-red-500 text-xs p-2 bg-red-50 rounded border border-red-100">
                Error loading maps: {loadError.message}
                <br />
                <span className="text-[10px] text-gray-500">Check API Key & Restrictions</span>
            </div>
        );
    }
    if (!isLoaded) return <div className="text-gray-500 text-sm animate-pulse">Loading maps...</div>;

    return <LocationPickerContent onLocationSelect={onLocationSelect} defaultValue={defaultValue} className={className} />;
};

const LocationPickerContent = ({ onLocationSelect, defaultValue, className }: LocationPickerProps) => {
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed, e.g., componentRestrictions: { country: "in" } */
            componentRestrictions: { country: "in" }
        },
        debounce: 300,
        defaultValue,
    });

    const [gpsLoading, setGpsLoading] = useState(false);

    // Sync local value with prop if it changes externally (optional, but good for edit forms)
    // useEffect(() => {
    //     if (defaultValue && defaultValue !== value) {
    //         setValue(defaultValue, false);
    //     }
    // }, [defaultValue, setValue]); 
    // Commented out to avoid loop if parent updates on type. Parent should handle initial state.

    const extractAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
        let city = '';
        let area = '';
        let sublocality = '';

        components.forEach(component => {
            const types = component.types;
            if (types.includes('locality')) {
                city = component.long_name;
            }
            if (types.includes('sublocality_level_1')) {
                area = component.long_name;
            }
            if (types.includes('sublocality') && !area) {
                sublocality = component.long_name;
            }
            if (types.includes('administrative_area_level_2') && !city) { // District fallback
                city = component.long_name;
            }
        });

        return { city, area: area || sublocality || city };
    };

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            const { city, area } = extractAddressComponents(results[0].address_components);

            onLocationSelect({
                address,
                city,
                area,
                coordinates: { latitude: lat, longitude: lng }
            });
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const handleGPSClick = async () => {
        // DEBUG: Alert on click
        alert("Debug: GPS Button Clicked");

        setGpsLoading(true);
        try {
            // Check permissions first
            alert("Debug: Checking permissions...");
            const permissionStatus = await CapacitorGeolocation.checkPermissions();
            alert(`Debug: Permission status: ${JSON.stringify(permissionStatus)}`);

            if (permissionStatus.location !== 'granted') {
                alert("Debug: Requesting permissions...");
                const requestStatus = await CapacitorGeolocation.requestPermissions();
                alert(`Debug: Request status: ${JSON.stringify(requestStatus)}`);
                if (requestStatus.location !== 'granted') {
                    throw new Error('Location permission denied');
                }
            }

            alert("Debug: Getting current position...");
            const position = await CapacitorGeolocation.getCurrentPosition();
            alert(`Debug: Got position: ${position.coords.latitude}, ${position.coords.longitude}`);
            const { latitude, longitude } = position.coords;

            try {
                // DEBUG: Show Key and Origin
                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'MISSING';
                const keyDisplay = apiKey.length > 5 ? apiKey.substring(0, 5) + '...' : apiKey;
                alert(`Debug: API Key: ${keyDisplay} | Origin: ${window.location.origin}`);

                alert("Debug: Testing Google Connectivity...");
                // Direct Fetch Test to rule out library issues
                try {
                    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai&key=${apiKey}`;
                    const testRes = await fetch(testUrl);
                    const testJson = await testRes.json();
                    alert(`Debug: Direct API Status: ${testJson.status}`);
                    if (testJson.error_message) {
                        alert(`Debug: API Error Message: ${testJson.error_message}`);
                    }
                } catch (netErr: any) {
                    alert(`Debug: NETWORK ERROR hitting maps.googleapis.com: ${netErr.message}`);
                    throw new Error("Network blocked");
                }

                alert("Debug: Geocoding start (Library)...");
                const geocodePromise = getGeocode({ location: { lat: latitude, lng: longitude } });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Geocoding TIMEOUT")), 10000));

                const results: any = await Promise.race([geocodePromise, timeoutPromise]);

                alert("Debug: Geocode response received");
                if (results && results[0]) {
                    const address = results[0].formatted_address;
                    const { city, area } = extractAddressComponents(results[0].address_components);

                    setValue(address, false);
                    onLocationSelect({
                        address,
                        city,
                        area,
                        coordinates: { latitude, longitude }
                    });
                    alert(`Debug: Location set to ${city}`);
                } else {
                    alert("Debug: No geocode results found");
                }
            } catch (error: any) {
                console.error("Geocoding failed", error);
                alert(`Debug Geocoding Error: ${error.message}`);
            }
        } catch (error: any) {
            console.error("GPS Error", error);
            alert(`Debug GPS Error: ${error.message}`);
        } finally {
            setGpsLoading(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={!ready}
                        placeholder="Search your location..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all"
                    />
                    {status === "OK" && (
                        <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                            {data.map(({ place_id, description }) => (
                                <li
                                    key={place_id}
                                    onClick={() => handleSelect(description)}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none"
                                >
                                    {description}
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* DEBUG: Show status if not OK/empty */}
                    {status && status !== "OK" && (
                        <div className="absolute top-full mt-1 left-0 w-full bg-red-50 text-red-600 text-xs p-2 rounded border border-red-200 z-40">
                            API Status: {status}
                        </div>
                    )}
                </div>
                <Button
                    type="button"
                    onClick={handleGPSClick}
                    disabled={gpsLoading}
                    variant="outline"
                    className="shrink-0 aspect-square h-auto p-0 w-[50px] flex items-center justify-center rounded-xl bg-gray-50 border-gray-200 hover:bg-[#005461]/10 hover:border-[#005461]/30 hover:text-[#005461]"
                    title="Use Current Location"
                >
                    {gpsLoading ? (
                        <div className="w-5 h-5 border-2 border-[#005461] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )}
                </Button>
            </div>
        </div>
    );
};
