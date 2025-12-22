'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { BackHeader } from '@/components/BackHeader';

function TutorProfileContent() {
    const searchParams = useSearchParams();
    const tutorId = searchParams.get('id');
    const router = useRouter();
    const { user, userData } = useAuth();

    const [ratings, setRatings] = useState<any[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingTutorName, setBookingTutorName] = useState<string>(''); // Captured when modal opens

    // Pause polling when modal is open to prevent remounting the modal
    const { data: tutor, loading } = useDocument<User>('users', tutorId || 'dummy', {
        pausePolling: showBookingModal
    });

    useEffect(() => {
        if (tutorId && tutor && user) {
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

        if (!tutorId) return;

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

        // Capture tutorName ONCE when modal opens - prevents re-renders from polling
        if (tutor?.tutorProfile) {
            setBookingTutorName(`${tutor.tutorProfile.firstName} ${tutor.tutorProfile.lastName}`);
        }
        setShowBookingModal(true);
    };

    const handleCreateBooking = async (bookingData: BookingData) => {
        if (!user || !tutor || !tutorId) return;

        try {
            const profile = tutor.tutorProfile!;
            const endTime = calculateEndTime(bookingData.startTime, bookingData.duration);
            const VISITING_CHARGE = 99;

            console.log('Creating booking with:', {
                duration: bookingData.duration,
                totalPrice: VISITING_CHARGE,
            });

            const bookingId = await BookingService.createBooking({
                studentId: user.uid,
                tutorId: tutorId,
                date: { toDate: () => bookingData.date } as any, // REST-compatible format
                startTime: bookingData.startTime,
                endTime: endTime,
                duration: bookingData.duration,
                hourlyRate: 0, // Not applicable for inspection
                totalPrice: VISITING_CHARGE,
                status: 'pending',
                paymentStatus: 'unpaid',
                notes: bookingData.notes,
                studentName: `${userData?.studentProfile?.firstName} ${userData?.studentProfile?.lastName}`,
                tutorName: `${profile.firstName} ${profile.lastName}`,
            });

            console.log('Booking created with ID:', bookingId);

            setShowBookingModal(false);
            router.push('/student/bookings');
        } catch (error: any) {
            console.error('Failed to create booking:', error);
            alert(error.message || 'Failed to create booking. Please try again.');
            throw error; // Propagate error to child component
        }
    };

    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    };

    if (!tutorId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Invalid Link</h2>
                    <p className="text-muted-foreground">No provider ID specified.</p>
                </div>
            </div>
        );
    }

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
    const isVerified = profile.verified;
    const hasActiveSubscription = profile.subscription?.status === 'active';

    // Allow admin or the tutor themselves to view their own profile regardless of status
    const canView = (user && user.uid === tutorId) || (userData?.role === 'admin') || (isVerified && hasActiveSubscription);

    if (!canView) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Profile Unavailable</h2>
                    <p className="text-muted-foreground">This provider's profile is currently not visible.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <BackHeader title="Provider Details" className="py-4 px-0" />

            <div className="container mx-auto px-4 pt-4">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <Card className="sticky top-24 border-none shadow-sm overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-[#005461] to-[#002025]"></div>
                            <CardContent className="p-6 pt-0 relative">
                                <div className="text-center -mt-12">
                                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-white p-1 shadow-md">
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl text-white overflow-hidden">
                                            {profile.profilePicture ? (
                                                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{profile.firstName[0]}{profile.lastName[0]}</span>
                                            )}
                                        </div>
                                    </div>

                                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                                        {profile.firstName} {profile.lastName}
                                    </h1>

                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        {profile.verified && (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                ✓ Verified
                                            </Badge>
                                        )}
                                        <div className="flex items-center gap-1 text-sm font-medium">
                                            <span className="text-yellow-500">★</span>
                                            <span>{profile.averageRating ? profile.averageRating.toFixed(1) : 'New'}</span>
                                            <span className="text-muted-foreground font-normal">({profile.totalRatings || 0})</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[#E0F7FA] rounded-xl mb-4 border border-[#B2EBF2]">
                                        <div className="text-2xl font-bold text-[#006064] mb-1">
                                            ₹99
                                        </div>
                                        <p className="text-xs text-[#006064]/80 font-medium uppercase tracking-wide">
                                            Visiting Charge
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {userData?.role === 'tutor' ? (
                                            <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md text-center">
                                                Service providers cannot book other providers.
                                            </div>
                                        ) : (
                                            <Button className="w-full font-semibold shadow-lg shadow-primary/20" size="lg" onClick={handleBookSession}>
                                                Book Service
                                            </Button>
                                        )}
                                    </div>

                                    {/* Pricing Disclaimer */}
                                    <div className="mt-4 text-left">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            <span className="font-semibold text-gray-700">Note:</span> Final service charges will be quoted by the provider after on-site inspection. The ₹99 charge covers the visit only.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Details */}
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Service Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Services Offered</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(profile.subjects || []).map((subject, i) => (
                                            <Badge key={i} variant="outline" className="px-3 py-1 text-sm border-gray-200 bg-gray-50 text-gray-700">{subject}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <span className="text-xs text-muted-foreground block mb-1">Experience</span>
                                        <span className="font-semibold text-gray-900">{profile.experience} years</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <span className="text-xs text-muted-foreground block mb-1">Location</span>
                                        <span className="font-semibold text-gray-900 truncate block">{profile.city}, {profile.area}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Service Type</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(profile.teachingType || []).map((type, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                                                {type === 'online' ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                )}
                                                {type === 'online' ? 'Remote' : type === 'in-person' ? 'On-site' : type}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reviews */}
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Reviews</CardTitle>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">{profile.totalRatings || 0}</Badge>
                            </CardHeader>
                            <CardContent>
                                {ratings.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-muted-foreground">No reviews yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {ratings.map((rating) => (
                                            <div key={rating.id} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                            {rating.studentName ? rating.studentName[0] : 'A'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{rating.studentName || 'Anonymous'}</p>
                                                            <div className="flex text-yellow-400 text-xs">
                                                                {Array.from({ length: rating.stars }).map((_, i) => (
                                                                    <span key={i}>★</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-medium">
                                                        {rating.timestamp?.toDate().toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {rating.comment && (
                                                    <p className="text-sm text-gray-700 leading-relaxed mt-2">{rating.comment}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Booking Modal - Only depends on stable values to prevent re-mounting */}
                {
                    showBookingModal && tutorId && (
                        <BookingModal
                            key="booking-modal"
                            tutorId={tutorId}
                            tutorName={bookingTutorName}
                            onClose={() => setShowBookingModal(false)}
                            onBook={handleCreateBooking}
                        />
                    )
                }
            </div >
        </div>
    );
}

export default function TutorProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <TutorProfileContent />
        </Suspense>
    );
}
