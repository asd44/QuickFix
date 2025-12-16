'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RatingService } from '@/lib/services/rating.service';
import { UserService } from '@/lib/services/user.service';
import { Rating } from '@/lib/types/database';
import { format } from 'date-fns';
import { BackHeader } from '@/components/BackHeader';

type RatingWithTutor = Rating & {
    tutorName?: string;
};

export default function StudentReviewsPage() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<RatingWithTutor[]>([]);
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
            const userReviews = await RatingService.getStudentRatings(user.uid);

            // Fetch tutor details for each review
            const reviewsWithTutor = await Promise.all(
                userReviews.map(async (review) => {
                    try {
                        const tutorProfile = await UserService.getUserProfile(review.tutorId);
                        return {
                            ...review,
                            tutorName: tutorProfile?.tutorProfile
                                ? `${tutorProfile.tutorProfile.firstName} ${tutorProfile.tutorProfile.lastName}`
                                : 'Unknown Provider'
                        };
                    } catch (e) {
                        return { ...review, tutorName: 'Unknown Provider' };
                    }
                })
            );

            setReviews(reviewsWithTutor);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen pb-20 bg-white">
            <BackHeader title="My Reviews" className="py-4 px-0" />

            <div className="px-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-3 border-[#005461] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4">
                            📝
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</h3>
                        <p className="text-gray-500 max-w-xs">
                            You haven't written any reviews yet. Reviews help others find great service providers.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{review.tutorName}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {format(review.timestamp.toDate(), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100">
                                        <span className="text-sm">⭐</span>
                                        <span className="font-bold text-sm text-yellow-700">{review.stars}</span>
                                    </div>
                                </div>

                                {review.comment && (
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
