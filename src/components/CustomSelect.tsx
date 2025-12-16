'use client';

import { useState, useRef, useEffect } from 'react';

interface CustomSelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: CustomSelectOption[];
    placeholder?: string;
    label?: string;
    className?: string; // Classes for the button trigger
    error?: string;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    label,
    className = '',
    error
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside and handle position
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);

            // Check available space
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                // Increased threshold to account for Bottom Navigation bar (~80px) + Dropdown height
                const minSpaceRequired = 300;
                setDropUp(spaceBelow < minSpaceRequired);
            }
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-2" ref={containerRef}>
            {label && (
                <label className="text-sm font-semibold text-gray-700 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full text-left flex items-center justify-between transition-all outline-none ${className} ${error ? 'border-red-500' : ''}`}
                >
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <svg
                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className={`absolute left-0 w-full z-[9999] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-fade-in ${dropUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'}`}>
                        <div className="max-h-60 overflow-y-auto py-1">
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${value === option.value
                                        ? 'bg-[#005461]/5 text-[#005461] font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && (
                                        <svg className="w-4 h-4 text-[#005461]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
