import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
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

        // Use a deterministic document ID based on tutor-student pair
        const docId = `${tutorId}_${studentId}`;

        // Check if document exists
        const existingDoc = await FirestoreREST.getDoc<InterestedStudent>('interestedStudents', docId);

        if (existingDoc) {
            // Update existing document - increment the count for this action
            const currentCount = (existingDoc as any)[`${action}Count`] || 0;
            const totalCount = existingDoc.totalCount || 0;

            await FirestoreREST.updateDoc('interestedStudents', docId, {
                lastTimestamp: FirestoreREST.serverTimestamp(),
                [`${action}Count`]: currentCount + 1,
                totalCount: totalCount + 1,
            });
        } else {
            // Create new document with initial count
            const interestData = {
                tutorId,
                studentId,
                timestamp: FirestoreREST.serverTimestamp(),
                lastTimestamp: FirestoreREST.serverTimestamp(),
                [`${action}Count`]: 1,
                totalCount: 1,
                studentInfo: {
                    firstName: student.studentProfile.firstName,
                    grade: student.studentProfile.grade || '',
                    city: student.studentProfile.city,
                },
            };
            await FirestoreREST.setDoc('interestedStudents', docId, interestData);
        }
    }

    // Get interested students for a tutor
    static async getInterestedStudents(tutorId: string, limit: number = 50): Promise<InterestedStudent[]> {
        const students = await FirestoreREST.query<InterestedStudent>('interestedStudents', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });

        return students
            .sort((a, b) => ((b.lastTimestamp as any)?.seconds || 0) - ((a.lastTimestamp as any)?.seconds || 0))
            .slice(0, limit);
    }

    // Polling-based listener for interested students
    static listenToInterestedStudents(tutorId: string, callback: (students: InterestedStudent[]) => void, limitCount: number = 50): () => void {
        this.getInterestedStudents(tutorId, limitCount).then(callback);
        const interval = setInterval(() => {
            this.getInterestedStudents(tutorId, limitCount).then(callback);
        }, 10000);
        return () => clearInterval(interval);
    }
}
