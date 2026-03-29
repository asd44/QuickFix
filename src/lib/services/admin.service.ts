import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
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
        const newsData = {
            title,
            content,
            type,
            breaking,
            publishedAt: FirestoreREST.serverTimestamp(),
            authorId,
        };

        await FirestoreREST.addDoc('news', newsData);
    }

    // Get news
    static async getNews(): Promise<(News & { id: string })[]> {
        const news = await FirestoreREST.query<News & { id: string }>('news', {
            orderBy: [{ field: 'publishedAt', direction: 'DESCENDING' }]
        });
        return news;
    }

    // Polling-based listener for news
    static listenToNews(callback: (news: (News & { id: string })[]) => void): () => void {
        this.getNews().then(callback);
        const interval = setInterval(() => {
            this.getNews().then(callback);
        }, 30000); // Poll every 30 seconds for news
        return () => clearInterval(interval);
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
        const complaintData = {
            reporterId,
            reporterRole,
            reportedId: reportedId || '',
            issue,
            description,
            status: 'pending',
            createdAt: FirestoreREST.serverTimestamp(),
        };

        await FirestoreREST.addDoc('complaints', complaintData);
    }

    // Get pending complaints
    static async getPendingComplaints(): Promise<Complaint[]> {
        const complaints = await FirestoreREST.query<Complaint>('complaints', {
            where: [{ field: 'status', op: 'EQUAL', value: 'pending' }],
            orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }]
        });
        return complaints;
    }

    // Resolve complaint
    static async resolveComplaint(complaintId: string, adminNotes?: string): Promise<void> {
        await FirestoreREST.updateDoc('complaints', complaintId, {
            status: 'resolved',
            resolvedAt: FirestoreREST.serverTimestamp(),
            adminNotes: adminNotes || '',
        });
    }

    // Dismiss complaint
    static async dismissComplaint(complaintId: string, adminNotes?: string): Promise<void> {
        await FirestoreREST.updateDoc('complaints', complaintId, {
            status: 'dismissed',
            resolvedAt: FirestoreREST.serverTimestamp(),
            adminNotes: adminNotes || '',
        });
    }

    // ===== TUTOR VERIFICATION =====

    // Get pending tutor verifications
    static async getPendingVerifications(): Promise<User[]> {
        // Get all tutors and filter client-side
        const tutors = await FirestoreREST.query<User>('users', {
            where: [
                { field: 'role', op: 'EQUAL', value: 'tutor' },
                { field: 'tutorProfile.verified', op: 'EQUAL', value: false },
            ]
        });

        // Filter for those with verification documents
        return tutors.filter(t =>
            t.tutorProfile?.verificationDocuments &&
            t.tutorProfile.verificationDocuments.length > 0
        );
    }

    // Approve tutor verification
    static async approveTutor(tutorId: string): Promise<void> {
        await FirestoreREST.updateDoc('users', tutorId, {
            'tutorProfile.verified': true,
        });
    }

    // Reject tutor verification
    static async rejectTutor(tutorId: string, reason?: string): Promise<void> {
        await FirestoreREST.updateDoc('users', tutorId, {
            'tutorProfile.verified': false,
            'tutorProfile.verificationDocuments': [],
            'tutorProfile.rejectionReason': reason || '',
        });
    }

    // ===== USER MANAGEMENT =====

    // Get all users
    static async getAllUsers(role?: 'student' | 'tutor' | 'admin'): Promise<User[]> {
        if (role) {
            return FirestoreREST.query<User>('users', {
                where: [{ field: 'role', op: 'EQUAL', value: role }],
                orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }]
            });
        } else {
            return FirestoreREST.query<User>('users', {
                orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }]
            });
        }
    }

    // Ban/suspend user
    static async banUser(userId: string): Promise<void> {
        await FirestoreREST.updateDoc('users', userId, {
            banned: true,
            bannedAt: FirestoreREST.serverTimestamp(),
        });
    }
}
