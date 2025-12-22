import { FirestoreREST, QueryFilter } from '@/lib/firebase/nativeFirestore';
import { User, TutorSearchFilters, TutorProfile } from '@/lib/types/database';

export class TutorService {
    // Search tutors with filters
    static async searchTutors(
        filters: TutorSearchFilters = {},
        limit: number = 20
    ): Promise<{ tutors: User[]; lastDoc: any }> {
        // Only use simple field queries that work with REST API
        // Nested field queries like tutorProfile.verified don't work correctly
        const whereFilters: QueryFilter[] = [
            { field: 'role', op: 'EQUAL', value: 'tutor' },
        ];

        // Fetch all tutors first
        let tutors = await FirestoreREST.query<User>('users', {
            where: whereFilters,
            limit: 100 // Fetch more, filter client-side
        });

        console.log('[TutorService] Raw tutors fetched:', tutors.length);

        // Client-side filtering for verified and subscription status
        tutors = tutors.filter(t => {
            const profile = t.tutorProfile;
            if (!profile) return false;

            // Must be verified
            if (!profile.verified) {
                console.log('[TutorService] Filtering out unverified:', t.uid);
                return false;
            }

            // Must have active subscription
            if (profile.subscription?.status !== 'active') {
                console.log('[TutorService] Filtering out no subscription:', t.uid, profile.subscription?.status);
                return false;
            }

            // Must not be deactivated or suspended
            if (profile.isActivated === false || profile.isSuspended) return false;

            return true;
        });

        console.log('[TutorService] After filtering:', tutors.length);

        // Apply additional filters client-side
        if (filters.subject) {
            tutors = tutors.filter(t => t.tutorProfile?.subjects?.includes(filters.subject!));
        }

        if (filters.grade) {
            tutors = tutors.filter(t => t.tutorProfile?.grades?.includes(filters.grade!));
        }

        if (filters.city) {
            tutors = tutors.filter(t => t.tutorProfile?.city === filters.city);
        }

        if (filters.gender) {
            tutors = tutors.filter(t => t.tutorProfile?.gender === filters.gender);
        }

        if (filters.teachingType) {
            tutors = tutors.filter(t => t.tutorProfile?.teachingType?.includes(filters.teachingType!));
        }

        // Price filtering
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            tutors = tutors.filter(tutor => {
                const rate = tutor.tutorProfile?.hourlyRate || 0;
                if (filters.minPrice !== undefined && rate < filters.minPrice) return false;
                if (filters.maxPrice !== undefined && rate > filters.maxPrice) return false;
                return true;
            });
        }

        return { tutors: tutors.slice(0, limit), lastDoc: null };
    }

    // Get featured tutors (for homepage)
    static async getFeaturedTutors(limit: number = 6): Promise<User[]> {
        const tutors = await FirestoreREST.query<User>('users', {
            where: [
                { field: 'role', op: 'EQUAL', value: 'tutor' },
            ],
            limit: 100
        });

        // Client-side filtering for verified, subscription, and activation status
        return tutors.filter(t => {
            const profile = t.tutorProfile;
            if (!profile) return false;
            if (!profile.verified) return false;
            if (profile.subscription?.status !== 'active') return false;
            if (profile.isActivated === false || profile.isSuspended) return false;
            return true;
        }).slice(0, limit);
    }

    // Get top rated tutors (rating >= 4)
    static async getTopRatedTutors(limit: number = 6): Promise<User[]> {
        const tutors = await FirestoreREST.query<User>('users', {
            where: [
                { field: 'role', op: 'EQUAL', value: 'tutor' },
            ],
            limit: 100
        });

        // Client-side filtering and sorting
        return tutors
            .filter(t => {
                const profile = t.tutorProfile;
                if (!profile) return false;
                if (!profile.verified) return false;
                if (profile.subscription?.status !== 'active') return false;
                if (profile.isActivated === false || profile.isSuspended) return false;
                if ((profile.averageRating || 0) < 4) return false;
                return true;
            })
            .sort((a, b) => (b.tutorProfile?.averageRating || 0) - (a.tutorProfile?.averageRating || 0))
            .slice(0, limit);
    }

    // Update tutor profile
    static async updateTutorProfile(uid: string, profile: Partial<TutorProfile>): Promise<void> {
        await FirestoreREST.updateDoc('users', uid, { tutorProfile: profile });
    }

    // Submit KYC Documents
    static async submitKYC(userId: string, data: { selfie: File, idFile: File, idNumber: string, idType: string }): Promise<void> {
        const { StorageService } = await import('./storage.service');

        // 1. Upload Selfie
        const selfieUrl = await StorageService.uploadVerificationDocument(userId, data.selfie);

        // 2. Upload ID File
        const idUrl = await StorageService.uploadVerificationDocument(userId, data.idFile);

        // 3. Update User Profile
        await FirestoreREST.updateDoc('users', userId, {
            'tutorProfile.kyc': {
                status: 'pending',
                submittedAt: new Date().toISOString(),
                idProofUrl: idUrl,
                photoUrl: selfieUrl,
                idType: data.idType,
                idNumber: data.idNumber
            },
            'tutorProfile.verificationDocuments': [idUrl, selfieUrl],
            'tutorProfile.verified': false
        });
    }

    // Toggle profile activation status
    static async toggleProfileStatus(uid: string, isActivated: boolean): Promise<void> {
        await FirestoreREST.updateDoc('users', uid, {
            'tutorProfile.isActivated': isActivated
        });
    }

    // Toggle profile suspension status (Admin only)
    static async toggleSuspensionStatus(uid: string, isSuspended: boolean): Promise<void> {
        const updates: any = {
            'tutorProfile.isSuspended': isSuspended,
            'tutorProfile.isActivated': !isSuspended,
        };

        if (!isSuspended) {
            updates['tutorProfile.subscription.status'] = 'active';
            updates['tutorProfile.verified'] = true;
        }

        await FirestoreREST.updateDoc('users', uid, updates);
    }
}
