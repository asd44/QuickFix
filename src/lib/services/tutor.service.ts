import { collection, query, where, getDocs, orderBy, limit as firestoreLimit, startAfter, QueryConstraint, doc, updateDoc, setDoc } from 'firebase/firestore';
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
        // constraints.push(orderBy('tutorProfile.averageRating', 'desc')); // Removed to show all providers
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

        // Filter out deactivated profiles (client-side to support legacy data where field is missing)
        tutors = tutors.filter(t => t.tutorProfile?.isActivated !== false);

        return { tutors, lastDoc };
    }

    // Get featured tutors (for homepage)
    static async getFeaturedTutors(limit: number = 6): Promise<User[]> {
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'tutor'),
            where('tutorProfile.verified', '==', true),
            where('tutorProfile.subscription.status', '==', 'active'), // Only active subscribers
            // orderBy('tutorProfile.averageRating', 'desc'), // Removed to show all providers even if rating is missing
            firestoreLimit(50) // Fetch more to allow for client-side filtering of deactivated profiles
        );

        const snapshot = await getDocs(q);
        const tutors = snapshot.docs.map(doc => doc.data() as User);

        // Filter out deactivated profiles and return requested limit
        return tutors.filter(t => t.tutorProfile?.isActivated !== false).slice(0, limit);
    }

    // Get top rated tutors (rating >= 4)
    static async getTopRatedTutors(limit: number = 6): Promise<User[]> {
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'tutor'),
            where('tutorProfile.verified', '==', true),
            where('tutorProfile.subscription.status', '==', 'active'),
            where('tutorProfile.averageRating', '>=', 4),
            orderBy('tutorProfile.averageRating', 'desc'),
            firestoreLimit(limit * 2) // Fetch more to allow for client-side filtering
        );

        const snapshot = await getDocs(q);
        const tutors = snapshot.docs.map(doc => doc.data() as User);

        // Filter out deactivated profiles and return requested limit
        return tutors.filter(t => t.tutorProfile?.isActivated !== false).slice(0, limit);
    }
    // Update tutor profile
    static async updateTutorProfile(uid: string, profile: Partial<import('@/lib/types/database').TutorProfile>): Promise<void> {
        await setDoc(doc(db, 'users', uid), {
            tutorProfile: profile,
        }, { merge: true });
    }

    // Submit KYC Documents
    static async submitKYC(userId: string, data: { selfie: File, idFile: File, idNumber: string, idType: string }): Promise<void> {
        const { StorageService } = await import('./storage.service');

        // 1. Upload Selfie
        const selfieUrl = await StorageService.uploadVerificationDocument(userId, data.selfie);

        // 2. Upload ID File
        const idUrl = await StorageService.uploadVerificationDocument(userId, data.idFile);

        // 3. Update User Profile
        await updateDoc(doc(db, 'users', userId), {
            'tutorProfile.kyc': {
                status: 'pending',
                submittedAt: new Date().toISOString(),
                idProofUrl: idUrl,
                photoUrl: selfieUrl,
                idType: data.idType,
                idNumber: data.idNumber
            },
            'tutorProfile.verificationDocuments': [idUrl, selfieUrl], // For backward compatibility / legacy admin check
            'tutorProfile.verified': false
        });
    }
    // Toggle profile activation status
    static async toggleProfileStatus(uid: string, isActivated: boolean): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            'tutorProfile.isActivated': isActivated
        });
    }
    // Toggle profile suspension status (Admin only)
    static async toggleSuspensionStatus(uid: string, isSuspended: boolean): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            'tutorProfile.isSuspended': isSuspended,
            // If suspended, deactivate visibility. If unsuspended (reactivated), make visible again.
            'tutorProfile.isActivated': !isSuspended,
            // Ensure subscription is active and profile is verified if reactivating
            ...(isSuspended ? {} : {
                'tutorProfile.subscription.status': 'active',
                'tutorProfile.verified': true
            })
        });
    }
}
