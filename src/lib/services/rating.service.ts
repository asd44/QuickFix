import { collection, addDoc, getDocs, query, where, orderBy, limit as firestoreLimit, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Rating } from '@/lib/types/database';
import { UserService } from './user.service';

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
            const existingQuery = query(
                collection(db, 'ratings'),
                where('studentId', '==', studentId),
                where('tutorId', '==', tutorId),
                where('sessionId', '==', sessionId)
            );

            const existing = await getDocs(existingQuery);
            if (!existing.empty) {
                throw new Error('You have already rated this session');
            }
        }

        // Create rating
        const ratingData: Omit<Rating, 'id'> = {
            studentId,
            tutorId,
            stars,
            comment,
            timestamp: serverTimestamp() as Timestamp,
            sessionId,
        };

        await addDoc(collection(db, 'ratings'), ratingData);

        // Update tutor's average rating
        await this.updateTutorRating(tutorId);
    }

    // Update tutor's average rating
    private static async updateTutorRating(tutorId: string): Promise<void> {
        const ratingsQuery = query(
            collection(db, 'ratings'),
            where('tutorId', '==', tutorId)
        );

        const snapshot = await getDocs(ratingsQuery);
        const ratings = snapshot.docs.map(doc => doc.data() as Rating);

        if (ratings.length === 0) return;

        const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
        const averageRating = totalStars / ratings.length;

        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.averageRating': averageRating,
            'tutorProfile.totalRatings': ratings.length,
        });
    }

    // Get tutor's ratings
    static async getTutorRatings(tutorId: string, limit: number = 10): Promise<any[]> {
        const q = query(
            collection(db, 'ratings'),
            where('tutorId', '==', tutorId),
            orderBy('timestamp', 'desc'),
            firestoreLimit(limit)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
    }

    // Get student's ratings (their rating history)
    static async getStudentRatings(studentId: string): Promise<Rating[]> {
        const q = query(
            collection(db, 'ratings'),
            where('studentId', '==', studentId),
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
    }
}
