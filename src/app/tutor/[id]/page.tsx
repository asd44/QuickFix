'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { BookingModal, BookingData } from '@/components/BookingModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocument } from '@/lib/hooks/useDocument';
import { User } from '@/lib/types/database';
import { UserService } from '@/lib/services/user.service';
import { InterestedStudentService } from '@/lib/services/interested-student.service';
import { ChatService } from '@/lib/services/chat.service';
import { RatingService } from '@/lib/services/rating.service';
import { BookingService } from '@/lib/services/booking.service';
import { Timestamp } from 'firebase/firestore';

export default function TutorProfilePage() {
    const params = useParams();
    const tutorId = params.id as string;
    const router = useRouter();
    const { user, userData } = useAuth();
    const { data: tutor, loading } = useDocument<User>('users', tutorId);
    const [ratings, setRatings] = useState<any[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        if (tutor && user) {
            // Track profile view
            UserService.incrementProfileViews(tutorId);
            InterestedStudentService.trackInterest(tutorId, user.uid, 'profile_view');
        }
    }, [tutor, user, tutorId]);

    useEffect(() => {
        if (tutorId) {
            RatingService.getTutorRatings(tutorId, 5).then(setRatings);
        }
    }, [tutorId]);

    const handleContactTutor = async () => {
        if (!user) {
            router.push('/auth/login');
            return;
        }

        try {
            const chatId = await ChatService.getOrCreateChat(user.uid, tutorId);
            router.push(`/student/messages?chatId=${chatId}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const handleBookSession = async () => {
        if (!user) {
            router.push('/auth/login');
            return;
        }

        setShowBookingModal(true);
    };

    const handleCreateBooking = async (bookingData: BookingData) => {
        if (!user || !tutor) return;

        try {
            const profile = tutor.tutorProfile!;
            const endTime = calculateEndTime(bookingData.startTime, bookingData.duration);
            const totalPrice = (bookingData.duration / 60) * profile.hourlyRate;

            console.log('Creating booking with:', {
                duration: bookingData.duration,
                hourlyRate: profile.hourlyRate,
                totalPrice: totalPrice,
            });

            const bookingId = await BookingService.createBooking({
                studentId: user.uid,
                tutorId: tutorId,
                date: Timestamp.fromDate(bookingData.date),
                startTime: bookingData.startTime,
                endTime: endTime,
                duration: bookingData.duration,
                hourlyRate: profile.hourlyRate,
                totalPrice: totalPrice,
                status: 'pending',
                paymentStatus: 'unpaid',
                notes: bookingData.notes,
                studentName: `${userData?.studentProfile?.firstName} ${userData?.studentProfile?.lastName}`,
                tutorName: `${profile.firstName} ${profile.lastName}`,
            });

            console.log('Booking created with ID:', bookingId);

            alert('Booking created successfully! Go to "My Bookings" to complete payment.');
            setShowBookingModal(false);
        } catch (error) {
            console.error('Failed to create booking:', error);
            throw error;
        }
    };

    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!tutor || !tutor.tutorProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Service Provider Not Found</h2>
                    <p className="text-muted-foreground">This service provider does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const profile = tutor.tutorProfile;

    return (
        <div className="min-h-screen py-8 container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl text-white">
                                    {profile.firstName[0]}{profile.lastName[0]}
                                </div>
                                <h1 className="text-2xl font-bold mb-2">
                                    {profile.firstName} {profile.lastName}
                                </h1>
                                {profile.verified && (
                                    <Badge className="mb-4">✓ Verified Provider</Badge>
                                )}

                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <span className="text-yellow-500 text-2xl">★</span>
                                    <span className="text-2xl font-bold">{profile.averageRating.toFixed(1)}</span>
                                    <span className="text-muted-foreground">({profile.totalRatings} reviews)</span>
                                </div>

                                <div className="text-3xl font-bold text-primary mb-2">
                                    Visiting Charge: ₹99
                                </div>
                                <p className="text-xs text-muted-foreground mb-6">
                                    For on-site inspection only
                                </p>

                                <div className="space-y-3">
                                    <Button className="w-full" onClick={handleContactTutor}>
                                        Message Provider
                                    </Button>
                                    <Button className="w-full" variant="outline" onClick={handleBookSession}>
                                        Book Inspection
                                    </Button>
                                </div>

                                {/* Pricing Disclaimer */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md mt-3">
                                    <p className="text-xs text-blue-800 dark:text-blue-200">
                                        💰 <strong>Note:</strong> Final service charges will be quoted by the provider after on-site inspection and job assessment. The ₹99 visiting charge covers the initial inspection only.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About */}
                    <Card>
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {profile.bio || 'No bio available'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Services Offered</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.subjects.map((subject, i) => (
                                        <Badge key={i} variant="outline">{subject}</Badge>
                                    ))}
                                </div>
                            </div>


                            <div>
                                <h3 className="font-semibold mb-2">Service Type</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.teachingType.map((type, i) => (
                                        <Badge key={i} variant="outline">
                                            {type === 'online' ? 'Remote' : type === 'in-person' ? 'On-site' : type}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Experience:</span>
                                    <span className="font-semibold ml-2">{profile.experience} years</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="font-semibold ml-2">{profile.city}, {profile.area}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reviews */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reviews ({profile.totalRatings})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ratings.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {ratings.map((rating) => (
                                        <div key={rating.id} className="border-b border-border pb-4 last:border-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex text-yellow-500">
                                                    {Array.from({ length: rating.stars }).map((_, i) => (
                                                        <span key={i}>★</span>
                                                    ))}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {rating.timestamp?.toDate().toLocaleDateString()}
                                                </span>
                                            </div>
                                            {rating.comment && (
                                                <p className="text-muted-foreground">{rating.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Booking Modal */}
            {
                showBookingModal && tutor?.tutorProfile && (
                    <BookingModal
                        tutorId={tutorId}
                        tutorName={`${tutor.tutorProfile.firstName} ${tutor.tutorProfile.lastName}`}
                        hourlyRate={tutor.tutorProfile.hourlyRate}
                        onClose={() => setShowBookingModal(false)}
                        onBook={handleCreateBooking}
                    />
                )
            }
        </div >
    );
}
