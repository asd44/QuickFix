'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { User, Booking } from '@/lib/types/database';
import Link from 'next/link';
import { Card, CardContent } from '@/components/Card';

const ITEMS_PER_PAGE = 10;

interface ProviderWithEarnings extends User {
    totalEarnings: number;
}

export default function EarningsPage() {
    const [providers, setProviders] = useState<ProviderWithEarnings[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchProvidersAndEarnings(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchProvidersAndEarnings = async (isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const offset = isInitial ? 0 : providers.length;

            // 1. Fetch Providers
            const fetchedProviders = await FirestoreREST.query<User & { id: string }>('users', {
                where: [{ field: 'role', op: 'EQUAL', value: 'tutor' }],
                orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
                limit: ITEMS_PER_PAGE,
                offset: offset
            });

            if (fetchedProviders.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            // 2. Fetch Earnings for each provider in parallel
            const providersWithEarnings = await Promise.all(fetchedProviders.map(async (provider) => {
                const uid = provider.id;

                // Fetch completed bookings for this provider
                const bookings = await FirestoreREST.query<Booking>('bookings', {
                    where: [
                        { field: 'tutorId', op: 'EQUAL', value: uid },
                        { field: 'status', op: 'EQUAL', value: 'completed' }
                    ]
                });

                // Calculate total
                const earnings = bookings.reduce((sum, booking) => {
                    // Use finalBillAmount if available, otherwise totalPrice
                    const amount = (booking as any).finalBillAmount || booking.totalPrice || 0;
                    return sum + amount;
                }, 0);

                return {
                    ...provider,
                    uid: provider.id,
                    totalEarnings: earnings
                };
            }));


            if (isInitial) {
                setProviders(providersWithEarnings);
            } else {
                setProviders(prev => {
                    const existingIds = new Set(prev.map(p => p.uid));
                    const uniqueNew = providersWithEarnings.filter(p => !existingIds.has(p.uid));
                    return [...prev, ...uniqueNew];
                });
            }

        } catch (error) {
            console.error("Error fetching earnings data:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchProvidersAndEarnings(true);
    }, []);

    const filteredProviders = providers.filter(provider =>
        provider.tutorProfile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.tutorProfile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.phoneNumber?.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#0f172a] text-white shadow-md sticky top-0 z-30">
                <div className="px-6 py-4 flex items-center gap-4">
                    <Link href="/admin" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold">Total Earnings</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="relative">
                            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="text-center py-10">Loading earnings...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProviders.map((provider, index) => {
                                const isLast = index === filteredProviders.length - 1;
                                return (
                                    <Link href={`/admin/earnings/view?id=${provider.uid}`} key={provider.uid} className="block group">
                                        <div ref={isLast ? lastElementRef : null}>
                                            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all h-full group-hover:-translate-y-1">
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 text-xl overflow-hidden shrink-0 border border-gray-100">
                                                            {provider.tutorProfile?.profilePicture ? (
                                                                <img
                                                                    src={provider.tutorProfile.profilePicture}
                                                                    alt={provider.tutorProfile.firstName || 'Provider'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).parentElement!.innerText = provider.tutorProfile?.firstName?.[0] || '?';
                                                                    }}
                                                                />
                                                            ) : (
                                                                provider.tutorProfile?.firstName?.[0] || '?'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {provider.tutorProfile ? `${provider.tutorProfile.firstName} ${provider.tutorProfile.lastName}` : 'Unprofiled'}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">{provider.phoneNumber || provider.email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-gray-100">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-500 text-sm">Total Earned</span>
                                                            <span className="font-bold text-green-600 text-lg">
                                                                ₹{provider.totalEarnings.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                    {loadingMore && <div className="text-center py-4 text-gray-500">Loading more...</div>}
                </div>
            </main>
        </div>
    );
}
