'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SearchFilters } from '@/components/SearchFilters';
import { BackHeader } from '@/components/BackHeader';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TutorService } from '@/lib/services/tutor.service';
import { InterestedStudentService } from '@/lib/services/interested-student.service';
import { User, TutorSearchFilters } from '@/lib/types/database';
import { useAuth } from '@/contexts/AuthContext';

function SearchPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');

    // Mapping from URL slugs to Database Subject names
    const SLUG_TO_SUBJECT: Record<string, string> = {
        'appliances': 'Kitchen Appliances',
        'ac': 'AC Services',
        'it': 'IT Services',
        'interior': 'Interior Designing',
        'event': 'Event Planner',
        'plumbing': 'Plumbing',
        'electrical': 'Electrical',
        'carpentry': 'Carpentry',
        'painting': 'Painting',
        'repairing': 'Repairing'
    };

    const getSubjectFromSlug = (slug: string | null) => {
        if (!slug) return undefined;
        // Check direct map
        if (SLUG_TO_SUBJECT[slug]) return SLUG_TO_SUBJECT[slug];
        // Fallback: Capitalize first letter (e.g. 'plumbing' -> 'Plumbing')
        return slug.charAt(0).toUpperCase() + slug.slice(1);
    };

    const [tutors, setTutors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<TutorSearchFilters>({
        subject: getSubjectFromSlug(categoryParam)
    });

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
                setError('No service provider found matching your criteria.');
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

    const handleFilterChange = (filters: { category: string; serviceType: string; location: string }) => {
        // If category is "All" or empty, use undefined. Otherwise map slug/name.
        const subject = (!filters.category || filters.category === 'All')
            ? undefined
            : getSubjectFromSlug(filters.category.toLowerCase()) || filters.category;

        const mappedFilters: TutorSearchFilters = {
            subject: subject,
            city: filters.location,
            // serviceType doesn't directly map to existing fields yet, ignoring for now
        };
        setFilters(mappedFilters);
        loadTutors(mappedFilters);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <BackHeader title="Find Service Provider" />

            <div className="container mx-auto px-4 py-8">

                {/* Filters at the top */}
                <SearchFilters
                    initialCategory={categoryParam || undefined}
                    onFilterChange={handleFilterChange}
                />

                {/* Results Section */}
                <div>
                    {error && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                            <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-2">{error}</p>
                            <p className="text-xs text-muted-foreground">No provider found in this category</p>
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
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                            <p className="text-muted-foreground">No service providers found. Try different filters.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tutors.map((tutor) => (
                                <Link key={tutor.uid} href={`/tutor/view?id=${tutor.uid}`}>
                                    <Card className="hover:shadow-lg transition-all cursor-pointer h-full border-none shadow-sm">
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
                                                    {(tutor.tutorProfile?.subjects || []).slice(0, 3).map((subject, i) => (
                                                        <Badge key={i} variant="outline">
                                                            {subject}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-500">★</span>
                                                        <span className="font-semibold">
                                                            {tutor.tutorProfile?.averageRating ? tutor.tutorProfile.averageRating.toFixed(1) : 'New'}
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
