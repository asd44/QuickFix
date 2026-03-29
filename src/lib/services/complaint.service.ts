import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { SuspensionAppeal } from '@/lib/types/database';

export class ComplaintService {

    // Create a new suspension appeal
    static async submitSuspensionAppeal(data: {
        userId: string;
        userEmail?: string;
        userName?: string;
        mobile: string;
        description: string;
    }): Promise<string> {
        try {
            const appealData = {
                userId: data.userId,
                userEmail: data.userEmail || '',
                userName: data.userName || '',
                mobile: data.mobile,
                description: data.description,
                status: 'pending',
                createdAt: FirestoreREST.serverTimestamp(),
            };

            const docId = await FirestoreREST.addDoc('suspension_appeals', appealData);
            return docId || '';
        } catch (error) {
            console.error('Error submitting appeal:', error);
            throw error;
        }
    }

    // Get all appeals (for Admin)
    static async getAllAppeals(statusFilter?: 'pending' | 'resolved' | 'reviewed'): Promise<SuspensionAppeal[]> {
        try {
            let appeals: SuspensionAppeal[];

            if (statusFilter) {
                appeals = await FirestoreREST.query<SuspensionAppeal>('suspension_appeals', {
                    where: [{ field: 'status', op: 'EQUAL', value: statusFilter }]
                });
            } else {
                appeals = await FirestoreREST.query<SuspensionAppeal>('suspension_appeals', {});
            }

            // Sort by createdAt descending (newest first)
            return appeals.sort((a, b) => {
                const timeA = (a.createdAt as any)?.seconds || 0;
                const timeB = (b.createdAt as any)?.seconds || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error('Error fetching appeals:', error);
            throw error;
        }
    }

    // Update appeal status
    static async updateAppealStatus(id: string, status: 'pending' | 'reviewed' | 'resolved', adminNotes?: string): Promise<void> {
        try {
            const updateData: any = {
                status,
            };

            if (status === 'resolved') {
                updateData.resolvedAt = FirestoreREST.serverTimestamp();
            }

            if (adminNotes) {
                updateData.adminNotes = adminNotes;
            }

            await FirestoreREST.updateDoc('suspension_appeals', id, updateData);
        } catch (error) {
            console.error('Error updating appeal status:', error);
            throw error;
        }
    }
}
