import { collection, addDoc, getDocs, doc, updateDoc, query, where, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Subscription } from '@/lib/types/database';

export class SubscriptionService {
    // Create/Update subscription for tutor
    static async createSubscription(
        tutorId: string,
        plan: 'monthly' | 'quarterly' | 'yearly',
        amount: number,
        paymentMethod: string = 'admin_granted'
    ): Promise<void> {
        const duration = plan === 'monthly' ? 30 : plan === 'quarterly' ? 90 : 365;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        const subscriptionData: Omit<Subscription, 'id'> = {
            tutorId,
            plan,
            amount,
            status: 'active',
            paymentMethod,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
        };

        await addDoc(collection(db, 'subscriptions'), subscriptionData);

        // Update tutor profile
        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.subscription': {
                plan,
                status: 'active',
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
            },
        });
    }

    // Admin: Grant free subscription
    static async grantSubscription(
        tutorId: string,
        plan: 'monthly' | 'quarterly' | 'yearly',
        durationDays?: number
    ): Promise<void> {
        const customDuration = durationDays || (plan === 'monthly' ? 30 : plan === 'quarterly' ? 90 : 365);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + customDuration);

        const subscriptionData: Omit<Subscription, 'id'> = {
            tutorId,
            plan,
            amount: 0,
            status: 'active',
            paymentMethod: 'admin_granted',
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
        };

        await addDoc(collection(db, 'subscriptions'), subscriptionData);

        // Update tutor profile
        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.subscription': {
                plan,
                status: 'active',
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
            },
        });
    }

    // Admin: Disable subscription
    static async disableSubscription(tutorId: string): Promise<void> {
        // Update all active subscriptions for this tutor
        const q = query(
            collection(db, 'subscriptions'),
            where('tutorId', '==', tutorId),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { status: 'expired' })
        );

        await Promise.all(updatePromises);

        // Update tutor profile
        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.subscription.status': 'expired',
        });
    }

    // Admin: Enable/Reactivate subscription
    static async enableSubscription(tutorId: string, extendDays: number = 30): Promise<void> {
        const userDoc = await getDoc(doc(db, 'users', tutorId));
        const userData = userDoc.data();
        const currentSubscription = userData?.tutorProfile?.subscription;

        const plan = currentSubscription?.plan || 'monthly';
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + extendDays);

        const subscriptionData: Omit<Subscription, 'id'> = {
            tutorId,
            plan,
            amount: 0,
            status: 'active',
            paymentMethod: 'admin_enabled',
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
        };

        await addDoc(collection(db, 'subscriptions'), subscriptionData);

        // Update tutor profile
        await updateDoc(doc(db, 'users', tutorId), {
            'tutorProfile.subscription': {
                plan,
                status: 'active',
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
            },
        });
    }

    // Get tutor's subscription history
    static async getTutorSubscriptions(tutorId: string): Promise<Subscription[]> {
        const q = query(
            collection(db, 'subscriptions'),
            where('tutorId', '==', tutorId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
    }

    // Get all active subscriptions (admin only)
    static async getAllActiveSubscriptions(): Promise<Subscription[]> {
        const q = query(
            collection(db, 'subscriptions'),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
    }

    // Check and expire old subscriptions (should be run periodically)
    static async expireOldSubscriptions(): Promise<void> {
        const now = new Date();
        const q = query(
            collection(db, 'subscriptions'),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        const expiredPromises = snapshot.docs
            .filter(doc => {
                const endDate = doc.data().endDate?.toDate();
                return endDate && endDate < now;
            })
            .map(async (subscriptionDoc) => {
                await updateDoc(subscriptionDoc.ref, { status: 'expired' });

                // Update tutor profile
                const tutorId = subscriptionDoc.data().tutorId;
                await updateDoc(doc(db, 'users', tutorId), {
                    'tutorProfile.subscription.status': 'expired',
                });
            });

        await Promise.all(expiredPromises);
    }
}
