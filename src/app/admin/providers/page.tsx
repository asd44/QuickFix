'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { User } from '@/lib/types/database';
import Link from 'next/link';
import { Card, CardContent } from '@/components/Card';


export default function AllProvidersPage() {
    const [providers, setProviders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'tutor'),
                    // orderBy('createdAt', 'desc') // Requires index, might skip strict ordering for now or handle client side
                );
                const querySnapshot = await getDocs(q);
                const providersList: User[] = [];
                querySnapshot.forEach((doc) => {
                    providersList.push({ ...doc.data(), uid: doc.id } as User);
                });
                setProviders(providersList);
            } catch (error) {
                console.error("Error fetching providers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProviders();
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
                    ) : filteredProviders.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No providers found matching your search.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProviders.map((provider) => (
                                <Link key={provider.uid} href={`/admin/providers/view?id=${provider.uid}`} className="block group">
                                    <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 h-full group-hover:-translate-y-1">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                                        {provider.tutorProfile?.profilePicture ? (
                                                            <img src={provider.tutorProfile.profilePicture} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-bold text-gray-400 uppercase">
                                                                {provider.tutorProfile?.firstName?.[0] || provider.email[0]}
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
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">Pending</span>
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
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
