'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RatingService } from '@/lib/services/rating.service';
import { UserService } from '@/lib/services/user.service';
import { Rating } from '@/lib/types/database';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/Card';
import { BackHeader } from '@/components/BackHeader';

type RatingWithStudent = Rating & {
    studentName?: string;
};

export default function TutorReviewsPage() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<RatingWithStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadReviews();
        }
    }, [user]);

    const loadReviews = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Get ratings for this tutor
            const tutorReviews = await RatingService.getTutorRatings(user.uid);

            // Fetch student details for each review
            const reviewsWithStudent = await Promise.all(
                tutorReviews.map(async (review) => {
                    try {
                        const studentProfile = await UserService.getUserProfile(review.studentId);
                        const name = studentProfile?.studentProfile
                            ? `${studentProfile.studentProfile.firstName} ${studentProfile.studentProfile.lastName}`
                            : ((studentProfile as any)?.name || 'Unknown Student');

                        return {
                            ...review,
                            studentName: name
                        };
                    } catch (e) {
                        return { ...review, studentName: 'Unknown Student' };
                    }
                })
            );

            setReviews(reviewsWithStudent);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            // Fallback for missing index or other errors
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen pb-20 bg-white">
            <BackHeader title="My Reviews" />

            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No reviews yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <Card key={review.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg">{review.studentName}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {review.timestamp?.toDate ? format(review.timestamp.toDate(), 'MMMM dd, yyyy') : 'Recent'}
                                            </p>
                                        </div>
                                        <div className="flex items-center bg-yellow-100 px-2 py-1 rounded text-yellow-700 font-bold text-sm">
                                            <span>⭐ {review.stars}</span>
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg text-sm">
                                            "{review.comment}"
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
