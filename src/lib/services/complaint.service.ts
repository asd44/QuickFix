
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    Timestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
            // Check if there is already a pending appeal for this user to prevent spam
            // We use 'pending' status to mean 'unresolved' effectively
            const pendingQuery = query(
                collection(db, 'suspension_appeals'),
                where('userId', '==', data.userId),
                where('status', '==', 'pending')
            );

            const existingDocs = await getDocs(pendingQuery);
            if (!existingDocs.empty) {
                console.warn('User already has a pending appeal');
                // We could throw here, or just return existing ID, or allow overwrite. 
                // For now, let's allow multiple calls but maybe UI should block it.
                // Or better, let's NOT block strict "spam" in case they want to add info, 
                // but usually one pending appeal is enough.
                // Let's stick to the previous logic of throwing/returning early if needed, 
                // but the user just asked for "submitted... stored". 
                // I will allow creating a new one or I'll just skip the check to ensure it ALWAYS writes if that was the issue. 
                // Actually, duplicate pending appeals are annoying for admins. 
                // I'll keep the check but make sure to communicate it.
                // NOTE: If the user deleted the file, maybe they ran into this "Error" and didn't like it.
                // I will remove the check for now to ensure data is ALWAYS written as requested "stored in database".
            }

            const appealData: Omit<SuspensionAppeal, 'id'> = {
                userId: data.userId,
                userEmail: data.userEmail || '',
                userName: data.userName || '',
                mobile: data.mobile,
                description: data.description,
                status: 'pending', // This acts as "unresolved"
                createdAt: Timestamp.now(), // Timestamp as requested
                // resolvedAt is undefined for new appeals, so we omit it or pass null. Omitted is better.
            };

            const docRef = await addDoc(collection(db, 'suspension_appeals'), appealData);
            return docRef.id;
        } catch (error) {
            console.error('Error submitting appeal:', error);
            throw error;
        }
    }

    // Get all appeals (for Admin) - fetches timestamps and status
    static async getAllAppeals(statusFilter?: 'pending' | 'resolved' | 'reviewed'): Promise<SuspensionAppeal[]> {
        try {
            // Client-side sorting to bypass complex index requirement for now
            let q = query(collection(db, 'suspension_appeals'));

            if (statusFilter) {
                // Single field query doesn't need index
                q = query(q, where('status', '==', statusFilter));
            }

            const querySnapshot = await getDocs(q);
            const appeals = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                } as SuspensionAppeal;
            });

            // Sort by createdAt descending (newest first)
            return appeals.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error('Error fetching appeals:', error);
            throw error;
        }
    }

    // Update appeal status (resolve/unresolved logic)
    static async updateAppealStatus(id: string, status: 'pending' | 'reviewed' | 'resolved', adminNotes?: string): Promise<void> {
        try {
            const updateData: any = {
                status,
                resolvedAt: status === 'resolved' ? Timestamp.now() : null
            };

            if (adminNotes) {
                updateData.adminNotes = adminNotes;
            }

            await updateDoc(doc(db, 'suspension_appeals', id), updateData);
        } catch (error) {
            console.error('Error updating appeal status:', error);
            throw error;
        }
    }
}
