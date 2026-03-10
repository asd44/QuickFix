'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { Booking, User } from '@/lib/types/database';
import Link from 'next/link';
import { Card, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';

const ITEMS_PER_PAGE = 10;

export default function EarningsViewPage() {
    const searchParams = useSearchParams();
    const providerId = searchParams.get('id');

    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [displayedBookings, setDisplayedBookings] = useState<Booking[]>([]);
    const [provider, setProvider] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreBookings();
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);


    // Initial Fetch (Get ALL bookings)
    const fetchAllBookings = async () => {
        if (!providerId) return;

        try {
            setLoading(true);

            // 1. Fetch Provider Details
            const fetchedProvider = await FirestoreREST.getDoc<User>('users', providerId);
            setProvider(fetchedProvider);

            // 2. Fetch ALL completed bookings (No orderBy to avoid index error)
            const fetchedBookings = await FirestoreREST.query<Booking & { id: string }>('bookings', {
                where: [
                    { field: 'tutorId', op: 'EQUAL', value: providerId },
                    { field: 'status', op: 'EQUAL', value: 'completed' }
                ]
            });

            // 3. Client-side Sort
            const sortedBookings = fetchedBookings.sort((a, b) => {
                const dateA = (a.createdAt as any)?.seconds || 0;
                const dateB = (b.createdAt as any)?.seconds || 0;
                return dateB - dateA; // Descending
            });

            setAllBookings(sortedBookings);

            // 4. Set Initial Display
            const initialLastIndex = Math.min(ITEMS_PER_PAGE, sortedBookings.length);
            setDisplayedBookings(sortedBookings.slice(0, initialLastIndex));

            if (sortedBookings.length <= ITEMS_PER_PAGE) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreBookings = () => {
        setLoadingMore(true);
        setTimeout(() => { // Small delay for UI feel
            const currentLength = displayedBookings.length;
            const nextLength = Math.min(currentLength + ITEMS_PER_PAGE, allBookings.length);

            setDisplayedBookings(prev => [
                ...prev,
                ...allBookings.slice(currentLength, nextLength)
            ]);

            if (nextLength >= allBookings.length) {
                setHasMore(false);
            }
            setLoadingMore(false);
        }, 500);
    };

    useEffect(() => {
        if (providerId) {
            fetchAllBookings();
        }
    }, [providerId]);


    const totalEarnings = allBookings.reduce((sum, b) => sum + ((b as any).finalBillAmount || b.totalPrice || 0), 0);

    if (!providerId) return <div>Invalid Provider ID</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#0f172a] text-white shadow-md sticky top-0 z-30">
                <div className="px-6 py-4 flex items-center gap-4">
                    <Link href="/admin/earnings" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Earnings Details</h1>
                        {provider && <p className="text-xs text-gray-300">for {provider.tutorProfile?.firstName} {provider.tutorProfile?.lastName}</p>}
                    </div>
                </div>
            </header>

            <main className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Summary Card */}
                    {provider && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{provider.tutorProfile?.firstName} {provider.tutorProfile?.lastName}</h2>
                                <p className="text-sm text-gray-500">{provider.phoneNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total Loaded Earnings</p>
                                <p className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">from {allBookings.length} loaded jobs</p>
                            </div>
                        </div>
                    )}

                    {/* Bookings List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Completed Jobs History</h3>

                        {loading ? (
                            <div className="text-center py-10">Loading history...</div>
                        ) : displayedBookings.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No completed bookings found.</div>
                        ) : (
                            displayedBookings.map((booking, index) => {
                                const isLast = index === displayedBookings.length - 1;
                                const amount = (booking as any).finalBillAmount || booking.totalPrice || 0;
                                const date = booking.createdAt ? new Date((booking.createdAt as any).seconds * 1000).toLocaleDateString() : 'Unknown Date';

                                return (
                                    <div key={booking.id} ref={isLast ? lastElementRef : null}>
                                        <Card className="bg-white border-gray-200 hover:shadow-sm transition-all">
                                            <CardContent className="p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{booking.subject || 'Service'}</p>
                                                    <p className="text-sm text-gray-500">Date: {date}</p>
                                                    {booking.studentName && <p className="text-xs text-gray-400 mt-1">Customer: {booking.studentName}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">+₹{amount}</p>
                                                    <Badge variant="outline" className="text-[10px] mt-1 text-gray-500 border-gray-200">
                                                        Completed
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })
                        )}

                        {loadingMore && <div className="text-center py-4 text-gray-500">Loading more history...</div>}
                    </div>
                </div>
            </main>
        </div>
    );
}
