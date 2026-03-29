import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { Rating } from '@/lib/types/database';

export class RatingService {
    // Submit a rating
    static async submitRating(
        studentId: string,
        tutorId: string,
        stars: number,
        comment?: string,
        sessionId?: string
    ): Promise<void> {
        // Check if student already rated this tutor for this session
        if (sessionId) {
            // Simplified check: Fetch all ratings for student and filter in memory
            // This avoids complex index requirements or strict query permission issues
            const studentRatings = await this.getStudentRatings(studentId);
            const existing = studentRatings.find(r => r.sessionId === sessionId);

            if (existing) {
                // Return silently if already rated to prevent UI errors (idempotency)
                // throw new Error('You have already rated this session');
                return;
            }
        }

        // Create rating
        const ratingData = {
            studentId,
            tutorId,
            stars,
            comment: comment || '',
            timestamp: FirestoreREST.serverTimestamp(),
            sessionId: sessionId || '',
        };

        await FirestoreREST.addDoc('ratings', ratingData);

        // Update booking to mark as rated (Best effort)
        if (sessionId) {
            try {
                await FirestoreREST.updateDoc('bookings', sessionId, {
                    rated: true,
                    updatedAt: FirestoreREST.serverTimestamp()
                });
            } catch (error) {
                console.warn('Could not mark booking as rated (permission restricted):', error);
                // Continue execution, do not throw
            }
        }

        // Update tutor's average rating (Best effort - might fail due to permissions)
        try {
            await this.updateTutorRating(tutorId);
        } catch (error) {
            console.warn('Could not update tutor average rating (permission restricted):', error);
            // We do NOT throw here, so the user sees the rating as successful
        }
    }

    // Update tutor's average rating
    private static async updateTutorRating(tutorId: string): Promise<void> {
        const ratings = await FirestoreREST.query<Rating>('ratings', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });

        if (ratings.length === 0) return;

        const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
        const averageRating = totalStars / ratings.length;

        await FirestoreREST.updateDoc('users', tutorId, {
            'tutorProfile.averageRating': averageRating,
            'tutorProfile.totalRatings': ratings.length,
        });
    }

    // Get tutor's ratings
    static async getTutorRatings(tutorId: string, limit: number = 10): Promise<(Rating & { studentName?: string })[]> {
        const ratings = await FirestoreREST.query<Rating>('ratings', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }],
            orderBy: [{ field: 'timestamp', direction: 'DESCENDING' }],
            limit
        });

        const results = await Promise.all(ratings.map(async (rating) => {
            let studentName = 'Anonymous';

            try {
                const student = await FirestoreREST.getDoc<any>('users', rating.studentId);
                if (student?.studentProfile) {
                    studentName = `${student.studentProfile.firstName} ${student.studentProfile.lastName}`;
                }
            } catch (error) {
                console.error('Error fetching student name for rating:', error);
            }

            return { ...rating, studentName };
        }));

        return results;
    }

    // Check if student has rated a session (Read-only check)
    static async hasStudentRatedSession(studentId: string, sessionId: string): Promise<boolean> {
        // Simplified check: Fetch all ratings for student and filter in memory
        const ratings = await this.getStudentRatings(studentId);
        return ratings.some(r => r.sessionId === sessionId);
    }

    // Get student's ratings (their rating history)
    static async getStudentRatings(studentId: string): Promise<Rating[]> {
        return FirestoreREST.query<Rating>('ratings', {
            where: [{ field: 'studentId', op: 'EQUAL', value: studentId }]
        });
    }

    // Get rating for a specific session
    static async getRatingForSession(sessionId: string): Promise<Rating | null> {
        const ratings = await FirestoreREST.query<Rating>('ratings', {
            where: [{ field: 'sessionId', op: 'EQUAL', value: sessionId }],
            limit: 1
        });
        return ratings.length > 0 ? ratings[0] : null;
    }
}
