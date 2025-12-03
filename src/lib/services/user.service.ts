import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, StudentProfile, TutorProfile } from '@/lib/types/database';

export class UserService {
    // Get user by ID
    static async getUserById(uid: string): Promise<User | null> {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data() as User;
        }
        return null;
    }

    // Update student profile
    static async updateStudentProfile(uid: string, profile: Partial<StudentProfile>): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            studentProfile: profile,
        });
    }

    // Update tutor profile
    static async updateTutorProfile(uid: string, profile: Partial<TutorProfile>): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            tutorProfile: profile,
        });
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

    // Increment profile views (public)
    static async incrementProfileViews(userId: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'tutorProfile.profileViews': increment(1),
        });
    }

    // Generic update profile method
    static async updateProfile(userId: string, updates: any): Promise<void> {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
    }
}
