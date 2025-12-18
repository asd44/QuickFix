import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { InterestedStudent } from '@/lib/types/database';
import { UserService } from './user.service';

export class InterestedStudentService {
    // Track interested student (profile view, search result, etc.)
    static async trackInterest(
        tutorId: string,
        studentId: string,
        action: 'profile_view' | 'search_result' | 'marked_interested'
    ): Promise<void> {
        // Get student info
        const student = await UserService.getUserById(studentId);
        if (!student?.studentProfile) return;

        // Check if already tracked recently (within 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentQuery = query(
            collection(db, 'interestedStudents'),
            where('tutorId', '==', tutorId),
            where('studentId', '==', studentId),
            where('action', '==', action),
            where('timestamp', '>', Timestamp.fromDate(oneDayAgo))
        );

        const existing = await getDocs(recentQuery);
        if (!existing.empty) return; // Already tracked recently

        const interestData: Omit<InterestedStudent, 'id'> = {
            tutorId,
            studentId,
            action,
            timestamp: serverTimestamp() as Timestamp,
            studentInfo: {
                firstName: student.studentProfile.firstName,
                grade: student.studentProfile.grade || '',
                city: student.studentProfile.city,
            },
        };

        await addDoc(collection(db, 'interestedStudents'), interestData);
    }

    // Get interested students for a tutor
    static async getInterestedStudents(tutorId: string, limit: number = 50): Promise<InterestedStudent[]> {
        const q = query(
            collection(db, 'interestedStudents'),
            where('tutorId', '==', tutorId),
            where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) // Last 30 days
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as InterestedStudent))
            .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
            .slice(0, limit);
    }

    // Listen to interested students in real-time
    static listenToInterestedStudents(tutorId: string, callback: (students: InterestedStudent[]) => void, limitCount: number = 50): () => void {
        const q = query(
            collection(db, 'interestedStudents'),
            where('tutorId', '==', tutorId),
            where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) // Last 30 days
        );

        return onSnapshot(q, (snapshot) => {
            const students = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as InterestedStudent))
                .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
                .slice(0, limitCount);
            callback(students);
        });
    }
}
