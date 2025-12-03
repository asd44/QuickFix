import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, Timestamp, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Booking } from '@/lib/types/database';

export class BookingService {
    // Create a new booking
    static async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        console.log('BookingService.createBooking called with data:', bookingData);

        const booking: Omit<Booking, 'id'> = {
            ...bookingData,
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        console.log('Saving booking to Firestore:', booking);

        const bookingRef = await addDoc(collection(db, 'bookings'), booking);

        console.log('Booking saved with ID:', bookingRef.id);

        return bookingRef.id;
    }

    // Get student's bookings
    static async getStudentBookings(studentId: string): Promise<(Booking & { id: string })[]> {
        console.log('getStudentBookings called with studentId:', studentId);

        const q = query(
            collection(db, 'bookings'),
            where('studentId', '==', studentId),
            firestoreOrderBy('date', 'desc')
        );

        console.log('Executing Firestore query for student...');
        const snapshot = await getDocs(q);
        console.log('Student query returned', snapshot.docs.length, 'documents');

        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Student booking document:', doc.id, data);
            return {
                id: doc.id,
                ...data,
            } as Booking & { id: string };
        });

        return bookings;
    }

    // Get tutor's bookings
    static async getTutorBookings(tutorId: string): Promise<(Booking & { id: string })[]> {
        console.log('getTutorBookings called with tutorId:', tutorId);

        const q = query(
            collection(db, 'bookings'),
            where('tutorId', '==', tutorId),
            firestoreOrderBy('date', 'desc')
        );

        console.log('Executing Firestore query...');
        const snapshot = await getDocs(q);
        console.log('Query returned', snapshot.docs.length, 'documents');

        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Booking document:', doc.id, data);
            return {
                id: doc.id,
                ...data,
            } as Booking & { id: string };
        });

        return bookings;
    }

    // Update booking status
    static async updateBookingStatus(
        bookingId: string,
        status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    ): Promise<void> {
        await updateDoc(doc(db, 'bookings', bookingId), {
            status,
            updatedAt: serverTimestamp(),
        });
    }

    // Cancel booking
    static async cancelBooking(bookingId: string, reason?: string): Promise<void> {
        await updateDoc(doc(db, 'bookings', bookingId), {
            status: 'cancelled',
            notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
            updatedAt: serverTimestamp(),
        });
    }

    // Update payment status
    static async updatePaymentStatus(
        bookingId: string,
        paymentStatus: 'unpaid' | 'paid' | 'refunded',
        paymentIntentId?: string
    ): Promise<void> {
        const updateData: any = {
            paymentStatus,
            updatedAt: serverTimestamp(),
        };

        if (paymentIntentId) {
            updateData.paymentIntentId = paymentIntentId;
        }

        // If payment is successful, also confirm the booking
        if (paymentStatus === 'paid') {
            updateData.status = 'confirmed';
        }

        await updateDoc(doc(db, 'bookings', bookingId), updateData);
    }

    // Get bookings for a specific date range
    static async getBookingsForDateRange(
        tutorId: string,
        startDate: Date,
        endDate: Date
    ): Promise<(Booking & { id: string })[]> {
        const q = query(
            collection(db, 'bookings'),
            where('tutorId', '==', tutorId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Booking & { id: string }));
    }

    // Start job - generates completion code
    static async startJob(bookingId: string): Promise<string> {
        const { CodeGenerator } = await import('@/lib/utils/code-generator');

        const code = CodeGenerator.generateCompletionCode();
        const expiresAt = CodeGenerator.getExpirationTime();

        await updateDoc(doc(db, 'bookings', bookingId), {
            status: 'in_progress',
            jobStartedAt: serverTimestamp(),
            completionCode: code,
            codeExpiresAt: Timestamp.fromDate(expiresAt),
            codeAttempts: 0,
            updatedAt: serverTimestamp(),
        });

        return code;
    }

    // Complete job with verification code and final bill
    static async completeJob(
        bookingId: string,
        code: string,
        amount: number,
        details: string
    ): Promise<void> {
        const { CodeGenerator } = await import('@/lib/utils/code-generator');

        // Get booking to validate code
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDocs(query(collection(db, 'bookings'), where('__name__', '==', bookingId)));

        if (bookingSnap.empty) {
            throw new Error('Booking not found');
        }

        const booking = bookingSnap.docs[0].data() as Booking;

        // Validate code
        if (!booking.completionCode) {
            throw new Error('No completion code found. Please start the job first.');
        }

        if (!CodeGenerator.validateCode(code, booking.completionCode)) {
            const attempts = (booking.codeAttempts || 0) + 1;
            await updateDoc(bookingRef, {
                codeAttempts: attempts,
                updatedAt: serverTimestamp()
            });

            if (attempts >= 3) {
                throw new Error('Too many failed attempts. Please ask customer to regenerate code.');
            }
            throw new Error(`Invalid completion code. ${3 - attempts} attempts remaining.`);
        }

        // Check expiration
        if (booking.codeExpiresAt && CodeGenerator.isExpired(booking.codeExpiresAt.toDate())) {
            throw new Error('Completion code expired. Please ask customer to regenerate code.');
        }

        // Validate amount
        if (amount <= 0) {
            throw new Error('Bill amount must be greater than 0');
        }

        // Update booking with completion details
        await updateDoc(bookingRef, {
            status: 'completed',
            jobCompletedAt: serverTimestamp(),
            finalBillAmount: amount,
            billDetails: details,
            billSubmittedAt: serverTimestamp(),
            finalPaymentStatus: 'pending',
            updatedAt: serverTimestamp(),
        });
    }

    // Regenerate completion code (if expired or forgotten)
    static async regenerateCompletionCode(bookingId: string): Promise<string> {
        const { CodeGenerator } = await import('@/lib/utils/code-generator');

        const newCode = CodeGenerator.generateCompletionCode();
        const expiresAt = CodeGenerator.getExpirationTime();

        await updateDoc(doc(db, 'bookings', bookingId), {
            completionCode: newCode,
            codeExpiresAt: Timestamp.fromDate(expiresAt),
            codeAttempts: 0,
            updatedAt: serverTimestamp(),
        });

        return newCode;
    }

    // Update final payment status (after Razorpay payment)
    static async updateFinalPaymentStatus(
        bookingId: string,
        paymentId: string,
        status: 'completed' | 'failed'
    ): Promise<void> {
        const updateData: any = {
            finalPaymentId: paymentId,
            finalPaymentStatus: status,
            updatedAt: serverTimestamp(),
        };

        if (status === 'completed') {
            updateData.paidAt = serverTimestamp();
        }

        await updateDoc(doc(db, 'bookings', bookingId), updateData);
    }
}
