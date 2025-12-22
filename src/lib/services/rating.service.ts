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
            const existing = await FirestoreREST.query<Rating>('ratings', {
                where: [
                    { field: 'studentId', op: 'EQUAL', value: studentId },
                    { field: 'tutorId', op: 'EQUAL', value: tutorId },
                    { field: 'sessionId', op: 'EQUAL', value: sessionId }
                ]
            });

            if (existing.length > 0) {
                throw new Error('You have already rated this session');
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

        // Update tutor's average rating
        await this.updateTutorRating(tutorId);
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

    // Get student's ratings (their rating history)
    static async getStudentRatings(studentId: string): Promise<Rating[]> {
        return FirestoreREST.query<Rating>('ratings', {
            where: [{ field: 'studentId', op: 'EQUAL', value: studentId }]
        });
    }
}
