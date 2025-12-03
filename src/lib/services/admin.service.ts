import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { News, Complaint, User } from '@/lib/types/database';

export class AdminService {
    // ===== NEWS MANAGEMENT =====

    // Create news article
    static async createNews(
        title: string,
        content: string,
        type: 'update' | 'alert' | 'general',
        breaking: boolean,
        authorId: string
    ): Promise<void> {
        const newsData: Omit<News, 'id'> = {
            title,
            content,
            type,
            breaking,
            publishedAt: serverTimestamp() as Timestamp,
            authorId,
        };

        await addDoc(collection(db, 'news'), newsData);
    }

    // Get news (real-time listener)
    static listenToNews(callback: (news: (News & { id: string })[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'news'),
            orderBy('publishedAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const news = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as News & { id: string }));
            callback(news);
        });
    }

    // ===== COMPLAINT MANAGEMENT =====

    // Submit complaint
    static async submitComplaint(
        reporterId: string,
        reporterRole: 'student' | 'tutor',
        issue: string,
        description: string,
        reportedId?: string
    ): Promise<void> {
        const complaintData: Omit<Complaint, 'id'> = {
            reporterId,
            reporterRole,
            reportedId,
            issue,
            description,
            status: 'pending',
            createdAt: serverTimestamp() as Timestamp,
        };

        await addDoc(collection(db, 'complaints'), complaintData);
    }

    // Get pending complaints
    static async getPendingComplaints(): Promise<Complaint[]> {
        const q = query(
            collection(db, 'complaints'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
    }

    // Resolve complaint
    static async resolveComplaint(complaintId: string, adminNotes?: string): Promise<void> {
        await updateDoc(doc(db, 'complaints', complaintId), {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            adminNotes,
        });
    }

    // Dismiss complaint
    static async dismissComplaint(complaintId: string, adminNotes?: string): Promise<void> {
        await updateDoc(doc(db, 'complaints', complaintId), {
            status: 'dismissed',
            resolvedAt: serverTimestamp(),
            adminNotes,
        });
    }

    // ===== TUTOR VERIFICATION =====

    // Get pending tutor verifications
    static async getPendingVerifications(): Promise<User[]> {
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'tutor'),
            where('tutorProfile.verified', '==', false),
            where('tutorProfile.verificationDocuments', '!=', []) // Has uploaded documents
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as User);
    }

    // Approve tutor verification
    static async approveTutor(tutorId: string): Promise<void> {
        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.verified': true,
        });
    }

    // Reject tutor verification
    static async rejectTutor(tutorId: string, reason?: string): Promise<void> {
        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.verified': false,
            'tutorProfile.verificationDocuments': [], // Clear documents
            'tutorProfile.rejectionReason': reason,
        });
    }

    // ===== USER MANAGEMENT =====

    // Get all users (with pagination)
    static async getAllUsers(role?: 'student' | 'tutor' | 'admin'): Promise<User[]> {
        let q;
        if (role) {
            q = query(
                collection(db, 'users'),
                where('role', '==', role),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as User);
    }

    // Ban/suspend user (update via Firebase Admin in real implementation)
    static async banUser(userId: string): Promise<void> {
        // In production, this would use Firebase Admin SDK to disable the user
        await updateDoc(doc(db, 'users', userId), {
            banned: true,
            bannedAt: serverTimestamp(),
        });
    }
}
