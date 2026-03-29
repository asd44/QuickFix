import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { User, StudentProfile, TutorProfile } from '@/lib/types/database';

export class UserService {
    // Get user by ID
    static async getUserById(uid: string): Promise<User | null> {
        return await FirestoreREST.getDoc<User>('users', uid);
    }

    // Get user profile (alias for getUserById)
    static async getUserProfile(uid: string): Promise<User | null> {
        return this.getUserById(uid);
    }

    // Update student profile
    static async updateStudentProfile(uid: string, profile: Partial<StudentProfile>): Promise<void> {
        await FirestoreREST.updateDoc('users', uid, { studentProfile: profile });
    }

    // Update tutor profile
    static async updateTutorProfile(uid: string, profile: Partial<TutorProfile>): Promise<void> {
        await FirestoreREST.updateDoc('users', uid, { tutorProfile: profile });
    }

    // Add tutor to favorites
    static async addFavorite(studentUid: string, tutorUid: string): Promise<void> {
        const userDoc = await this.getUserById(studentUid);
        if (userDoc?.studentProfile) {
            const favorites = userDoc.studentProfile.favorites || [];
            if (!favorites.includes(tutorUid)) {
                favorites.push(tutorUid);
                await this.updateStudentProfile(studentUid, { favorites });
            }
        }
    }

    // Remove tutor from favorites
    static async removeFavorite(studentUid: string, tutorUid: string): Promise<void> {
        const userDoc = await this.getUserById(studentUid);
        if (userDoc?.studentProfile) {
            const favorites = userDoc.studentProfile.favorites || [];
            const filtered = favorites.filter(id => id !== tutorUid);
            await this.updateStudentProfile(studentUid, { favorites: filtered });
        }
    }

    // Increment profile views
    static async incrementProfileViews(userId: string): Promise<void> {
        // Get current value and increment (REST API doesn't support atomic increment easily)
        const user = await this.getUserById(userId);
        if (user?.tutorProfile) {
            const currentViews = user.tutorProfile.profileViews || 0;
            await FirestoreREST.updateDoc('users', userId, {
                'tutorProfile.profileViews': currentViews + 1
            });
        }
    }

    // Generic update profile method
    static async updateProfile(userId: string, updates: any): Promise<void> {
        await FirestoreREST.updateDoc('users', userId, updates);
    }
}
