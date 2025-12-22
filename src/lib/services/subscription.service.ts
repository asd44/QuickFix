import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
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

        const subscriptionData = {
            tutorId,
            plan,
            amount,
            status: 'active',
            paymentMethod,
            startDate: { seconds: Math.floor(startDate.getTime() / 1000), nanoseconds: 0 },
            endDate: { seconds: Math.floor(endDate.getTime() / 1000), nanoseconds: 0 },
        };

        // Check for existing subscription and update instead of creating new
        const existing = await FirestoreREST.query<Subscription & { id: string }>('subscriptions', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });

        if (existing.length > 0) {
            // Update existing subscription
            await FirestoreREST.updateDoc('subscriptions', existing[0].id, subscriptionData);
        } else {
            await FirestoreREST.addDoc('subscriptions', subscriptionData);
        }

        // Update tutor profile using proper nested object structure
        await FirestoreREST.updateDoc('users', tutorId, {
            tutorProfile: {
                subscription: {
                    plan,
                    status: 'active',
                    startDate: subscriptionData.startDate,
                    endDate: subscriptionData.endDate,
                }
            }
        });

        console.log('[SubscriptionService] Subscription created/updated for:', tutorId);
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

        const subscriptionData = {
            tutorId,
            plan,
            amount: 0,
            status: 'active',
            paymentMethod: 'admin_granted',
            startDate: { seconds: Math.floor(startDate.getTime() / 1000), nanoseconds: 0 },
            endDate: { seconds: Math.floor(endDate.getTime() / 1000), nanoseconds: 0 },
        };

        // Check for existing subscription and update instead of creating new
        const existing = await FirestoreREST.query<Subscription & { id: string }>('subscriptions', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });

        if (existing.length > 0) {
            // Update existing subscription
            await FirestoreREST.updateDoc('subscriptions', existing[0].id, subscriptionData);
            console.log('[SubscriptionService] Updated existing subscription:', existing[0].id);
        } else {
            await FirestoreREST.addDoc('subscriptions', subscriptionData);
            console.log('[SubscriptionService] Created new subscription for:', tutorId);
        }

        // Update tutor profile using proper nested object structure
        await FirestoreREST.updateDoc('users', tutorId, {
            tutorProfile: {
                subscription: {
                    plan,
                    status: 'active',
                    startDate: subscriptionData.startDate,
                    endDate: subscriptionData.endDate,
                }
            }
        });

        console.log('[SubscriptionService] Subscription granted for:', tutorId);
    }

    // Admin: Disable subscription
    static async disableSubscription(tutorId: string): Promise<void> {
        const subscriptions = await FirestoreREST.query<Subscription & { id: string }>('subscriptions', {
            where: [
                { field: 'tutorId', op: 'EQUAL', value: tutorId },
                { field: 'status', op: 'EQUAL', value: 'active' }
            ]
        });

        await Promise.all(subscriptions.map(sub =>
            FirestoreREST.updateDoc('subscriptions', sub.id, { status: 'expired' })
        ));

        // Use proper nested object structure
        await FirestoreREST.updateDoc('users', tutorId, {
            tutorProfile: {
                subscription: {
                    status: 'expired'
                }
            }
        });

        console.log('[SubscriptionService] Subscription disabled for:', tutorId);
    }

    // Admin: Enable/Reactivate subscription
    static async enableSubscription(tutorId: string, extendDays: number = 30): Promise<void> {
        const user = await FirestoreREST.getDoc<any>('users', tutorId);
        const currentSubscription = user?.tutorProfile?.subscription;

        const plan = currentSubscription?.plan || 'monthly';
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + extendDays);

        const subscriptionData = {
            tutorId,
            plan,
            amount: 0,
            status: 'active',
            paymentMethod: 'admin_enabled',
            startDate: { seconds: Math.floor(startDate.getTime() / 1000), nanoseconds: 0 },
            endDate: { seconds: Math.floor(endDate.getTime() / 1000), nanoseconds: 0 },
        };

        // Check for existing subscription and update instead of creating new
        const existing = await FirestoreREST.query<Subscription & { id: string }>('subscriptions', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });

        if (existing.length > 0) {
            await FirestoreREST.updateDoc('subscriptions', existing[0].id, subscriptionData);
        } else {
            await FirestoreREST.addDoc('subscriptions', subscriptionData);
        }

        // Use proper nested object structure
        await FirestoreREST.updateDoc('users', tutorId, {
            tutorProfile: {
                subscription: {
                    plan,
                    status: 'active',
                    startDate: subscriptionData.startDate,
                    endDate: subscriptionData.endDate,
                }
            }
        });

        console.log('[SubscriptionService] Subscription enabled for:', tutorId);
    }

    // Get tutor's subscription history
    static async getTutorSubscriptions(tutorId: string): Promise<Subscription[]> {
        return FirestoreREST.query<Subscription>('subscriptions', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });
    }

    // Get all active subscriptions (admin only)
    static async getAllActiveSubscriptions(): Promise<Subscription[]> {
        return FirestoreREST.query<Subscription>('subscriptions', {
            where: [{ field: 'status', op: 'EQUAL', value: 'active' }]
        });
    }

    // Check and expire old subscriptions
    static async expireOldSubscriptions(): Promise<void> {
        const nowSeconds = Math.floor(Date.now() / 1000);

        const subscriptions = await FirestoreREST.query<Subscription & { id: string }>('subscriptions', {
            where: [{ field: 'status', op: 'EQUAL', value: 'active' }]
        });

        const expiredSubs = subscriptions.filter(sub => {
            const endSeconds = (sub.endDate as any)?.seconds || 0;
            return endSeconds < nowSeconds;
        });

        await Promise.all(expiredSubs.map(async (sub) => {
            await FirestoreREST.updateDoc('subscriptions', sub.id, { status: 'expired' });
            await FirestoreREST.updateDoc('users', sub.tutorId, {
                'tutorProfile.subscription.status': 'expired',
            });
        }));
    }
}
