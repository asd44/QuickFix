'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SearchFilters } from '@/components/SearchFilters';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TutorService } from '@/lib/services/tutor.service';
import { InterestedStudentService } from '@/lib/services/interested-student.service';
import { User, TutorSearchFilters } from '@/lib/types/database';
import { useAuth } from '@/contexts/AuthContext';

export default function SearchPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [tutors, setTutors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<TutorSearchFilters>({});

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadTutors(filters);
        }
    }, [user]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user) {
        return null;
    }

    const loadTutors = async (newFilters: TutorSearchFilters) => {
        setLoading(true);
        setError('');
        try {
            console.log('🔍 Searching with filters:', newFilters);
            const { tutors: results } = await TutorService.searchTutors(newFilters);
            console.log('✅ Search results:', results.length, results);

            setTutors(results);

            if (results.length === 0) {
                setError('No service providers found matching your criteria. Make sure providers have active subscriptions.');
            }

            // Track interest for each tutor viewed
            if (user && results.length > 0) {
                results.forEach(tutor => {
                    InterestedStudentService.trackInterest(
                        user.uid,
                        tutor.uid,
                        'search_result'
                    ).catch(err => console.error('Failed to track interest:', err));
                });
            }
        } catch (err: any) {
            console.error('❌ Search error:', err);
            setError(`Search failed: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: TutorSearchFilters) => {
        setFilters(newFilters);
        loadTutors(newFilters);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Find Your Perfect Service Provider</h1>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Filters */}
                <div className="lg:col-span-1">
                    <SearchFilters onFilterChange={handleFilterChange} />
                </div>

                {/* Results */}
                <div className="lg:col-span-3">
                    {error && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                            <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-2">{error}</p>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Possible reasons:</p>
                                <ul className="list-disc list-inside">
                                    <li>No tutors with active subscriptions</li>
                                    <li>Tutor not verified</li>
                                    <li>Database structure mismatch</li>
                                </ul>
                                <p className="mt-2">Check browser console (F12) for details</p>
                            </div>
                        </div>
                    )}

                    <div className="mb-4 flex justify-between items-center">
                        <p className="text-muted-foreground">
                            {loading ? 'Searching...' : `${tutors.length} service providers found`}
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading tutors...</p>
                        </div>
                    ) : tutors.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No service providers found. Try different filters.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-6">
                                {tutors.length} service providers found
                            </p>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tutors.map((tutor) => (
                                    <Link key={tutor.uid} href={`/tutor/${tutor.uid}`}>
                                        <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {tutor.tutorProfile?.firstName} {tutor.tutorProfile?.lastName}
                                                        </CardTitle>
                                                        {tutor.tutorProfile?.verified && (
                                                            <Badge variant="default" className="mt-1">
                                                                ✓ Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {tutor.tutorProfile?.bio || 'No bio available'}
                                                    </p>

                                                    <div className="flex flex-wrap gap-1">
                                                        {tutor.tutorProfile?.subjects.slice(0, 3).map((subject, i) => (
                                                            <Badge key={i} variant="outline">
                                                                {subject}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-yellow-500">★</span>
                                                            <span className="font-semibold">
                                                                {tutor.tutorProfile?.averageRating.toFixed(1) || '0.0'}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">
                                                                ({tutor.tutorProfile?.totalRatings || 0})
                                                            </span>
                                                        </div>

                                                        <div className="text-lg font-bold text-primary">
                                                            Visit: ₹99
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        📍 {tutor.tutorProfile?.city}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
