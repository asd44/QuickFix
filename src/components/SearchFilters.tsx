'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface SearchFiltersProps {
    onFilterChange: (filters: {
        category: string;
        serviceType: string;
        location: string;
    }) => void;
}

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
    const [category, setCategory] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [location, setLocation] = useState('');

    const handleChange = (field: string, value: string) => {
        const newFilters = {
            category: field === 'category' ? value : category,
            serviceType: field === 'serviceType' ? value : serviceType,
            location: field === 'location' ? value : location,
        };

        if (field === 'category') setCategory(value);
        if (field === 'serviceType') setServiceType(value);
        if (field === 'location') setLocation(value);

        onFilterChange(newFilters);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Service Category</label>
                    <select
                        className="w-full p-2 border rounded-md bg-background"
                        value={category}
                        onChange={(e) => handleChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="electrical">⚡ Electrical</option>
                        <option value="plumbing">🚰 Plumbing</option>
                        <option value="carpentry">🪚 Carpentry</option>
                        <option value="cleaning">🧹 Cleaning</option>
                        <option value="painting">🎨 Painting</option>
                        <option value="appliance">🔌 Appliance Repair</option>
                        <option value="pest">🐜 Pest Control</option>
                        <option value="maintenance">🏠 Home Maintenance</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Service Type</label>
                    <select
                        className="w-full p-2 border rounded-md bg-background"
                        value={serviceType}
                        onChange={(e) => handleChange('serviceType', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="installation">Installation</option>
                        <option value="repair">Repair</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="emergency">Emergency Service</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <input
                        type="text"
                        placeholder="Enter your area..."
                        className="w-full p-2 border rounded-md bg-background"
                        value={location}
                        onChange={(e) => handleChange('location', e.target.value)}
                    />
                </div>

                {/* Fixed Visiting Charge Notice */}
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            💰 Visiting Charges
                        </p>
                        <p className="text-blue-800 dark:text-blue-200">
                            Fixed at <strong>₹99</strong> for all service providers
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Actual service charges will be provided after on-site inspection
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
