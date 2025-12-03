import { collection, query, where, getDocs, orderBy, limit as firestoreLimit, startAfter, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, TutorSearchFilters } from '@/lib/types/database';

export class TutorService {
    // Search tutors with filters
    static async searchTutors(
        filters: TutorSearchFilters = {},
        limit: number = 20
    ): Promise<{ tutors: User[]; lastDoc: any }> {
        const constraints: any[] = [
            where('role', '==', 'tutor'),
            where('tutorProfile.verified', '==', true),
            // IMPORTANT: Only show tutors with active subscriptions
            where('tutorProfile.subscription.status', '==', 'active'),
        ];

        // Apply filters
        if (filters.subject) {
            constraints.push(where('tutorProfile.subjects', 'array-contains', filters.subject));
        }

        if (filters.grade) {
            constraints.push(where('tutorProfile.grades', 'array-contains', filters.grade));
        }

        if (filters.city) {
            constraints.push(where('tutorProfile.city', '==', filters.city));
        }

        if (filters.gender) {
            constraints.push(where('tutorProfile.gender', '==', filters.gender));
        }

        if (filters.teachingType) {
            constraints.push(where('tutorProfile.teachingType', 'array-contains', filters.teachingType));
        }

        // Price range filtering (done client-side since Firestore can't do range queries with other filters)
        constraints.push(orderBy('tutorProfile.averageRating', 'desc'));
        constraints.push(firestoreLimit(limit));

        const q = query(collection(db, 'users'), ...constraints);
        const snapshot = await getDocs(q);

        let tutors = snapshot.docs.map(doc => doc.data() as User);

        // Client-side price filtering
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            tutors = tutors.filter(tutor => {
                const rate = tutor.tutorProfile?.hourlyRate || 0;
                if (filters.minPrice !== undefined && rate < filters.minPrice) return false;
                if (filters.maxPrice !== undefined && rate > filters.maxPrice) return false;
                return true;
            });
        }

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        return { tutors, lastDoc };
    }

    // Get featured tutors (for homepage)
    static async getFeaturedTutors(limit: number = 6): Promise<User[]> {
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'tutor'),
            where('tutorProfile.verified', '==', true),
            where('tutorProfile.subscription.status', '==', 'active'), // Only active subscribers
            orderBy('tutorProfile.averageRating', 'desc'),
            firestoreLimit(limit)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as User);
    }
}
