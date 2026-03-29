'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { User } from '@/lib/types/database';
import Link from 'next/link';
import { Card, CardContent } from '@/components/Card';

const ITEMS_PER_PAGE = 10;

export default function AllProvidersPage() {
    const [providers, setProviders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasMore, setHasMore] = useState(true);

    // Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastProviderElementRef = useCallback((node: HTMLAnchorElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchProviders(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchProviders = async (isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const offset = isInitial ? 0 : providers.length;

            const fetchedProviders = await FirestoreREST.query<User & { id: string }>('users', {
                where: [{ field: 'role', op: 'EQUAL', value: 'tutor' }],
                orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
                limit: ITEMS_PER_PAGE,
                offset: offset
            });

            if (fetchedProviders.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            const newProviders = fetchedProviders.map(p => ({ ...p, uid: p.id }));

            if (isInitial) {
                setProviders(newProviders);
            } else {
                setProviders(prev => {
                    const existingIds = new Set(prev.map(p => p.uid));
                    const uniqueNew = newProviders.filter(p => !existingIds.has(p.uid));
                    return [...prev, ...uniqueNew];
                });
            }

        } catch (error) {
            console.error("Error fetching providers:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchProviders(true);
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
                    <h1 className="text-xl font-bold">All Providers</h1>
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
                                placeholder="Search providers by name, email, or phone..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Providers Grid */}
                    {loading ? (
                        <div className="text-center py-10">Loading providers...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProviders.map((provider, index) => {
                                const isLast = index === filteredProviders.length - 1;
                                return (
                                    <Link key={provider.uid} href={`/admin/providers/view?id=${provider.uid}`} className="block group" ref={isLast ? lastProviderElementRef : null}>
                                        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 h-full group-hover:-translate-y-1">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 font-bold text-gray-400 text-xl">
                                                            {provider.tutorProfile?.profilePicture ? (
                                                                <img
                                                                    src={provider.tutorProfile.profilePicture}
                                                                    alt={provider.tutorProfile.firstName || 'Provider'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).parentElement!.innerText = provider.tutorProfile?.firstName?.[0] || provider.email?.[0] || '?';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="uppercase">
                                                                    {provider.tutorProfile?.firstName?.[0] || provider.email?.[0] || '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {provider.tutorProfile ? `${provider.tutorProfile.firstName} ${provider.tutorProfile.lastName}` : 'Unprofiled User'}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 truncate max-w-[150px]">{provider.email}</p>
                                                        </div>
                                                    </div>
                                                    {provider.tutorProfile?.verified ? (
                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Verified</span>
                                                    ) : provider.tutorProfile?.kyc?.status === 'pending' ? (
                                                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">Pending</span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">Unverified</span>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Phone</span>
                                                        <span className="font-medium text-gray-900">{provider.phoneNumber || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Services</span>
                                                        <span className="font-medium text-gray-900 truncate max-w-[120px] text-right">
                                                            {provider.tutorProfile?.subjects?.join(', ') || '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Location</span>
                                                        <span className="font-medium text-gray-900">{provider.tutorProfile?.city || '-'}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
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
