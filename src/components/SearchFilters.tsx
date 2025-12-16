'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface SearchFiltersProps {
    initialCategory?: string;
    onFilterChange: (filters: {
        category: string;
        serviceType: string;
        location: string;
    }) => void;
}

export function SearchFilters({ initialCategory, onFilterChange }: SearchFiltersProps) {
    const [category, setCategory] = useState(initialCategory || '');
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
        <Card className="mb-6">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/2">
                        <label className="text-sm font-medium mb-1.5 block">Service Category</label>
                        <select
                            className="w-full p-2 border rounded-md bg-background text-sm"
                            value={category}
                            onChange={(e) => handleChange('category', e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="plumbing">🚰 Plumbing</option>
                            <option value="electrical">⚡ Electrical</option>
                            <option value="carpentry">🪚 Carpentry</option>
                            <option value="painting">🎨 Painting</option>
                            <option value="it">💻 IT Services</option>
                            <option value="ac">❄️ AC Services</option>
                            <option value="event">🎉 Event Planner</option>
                            <option value="interior">🏠 Interior Designing</option>
                            <option value="appliances">🔌 Kitchen Appliances</option>
                            <option value="repairing">🔧 Repairing</option>
                        </select>
                    </div>

                    {/* Fixed Visiting Charge Notice - Compact Version */}
                    <div className="w-full md:w-1/4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-2 flex items-center justify-center text-center">
                        <div className="text-xs text-blue-800 dark:text-blue-200">
                            <span className="font-bold">Fixed Visit Charge: ₹99</span>
                            <span className="block text-[10px] opacity-80">Final price after inspection</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
