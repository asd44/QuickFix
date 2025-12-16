import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, Timestamp, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Booking } from '@/lib/types/database';

import { CodeGenerator } from '@/lib/utils/code-generator';
import { NotificationService } from '@/lib/services/notification.service';

export class BookingService {
    // Create a new booking
    static async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const { setDoc, getDoc, doc } = await import('firebase/firestore');

        console.log('BookingService.createBooking called with data:', bookingData);

        // Normalize date to midnight to ensure consistency
        const dateObj = bookingData.date.toDate();
        dateObj.setHours(0, 0, 0, 0);
        const normalizedDate = Timestamp.fromDate(dateObj);

        // Construct Deterministic ID for duplicate prevention
        // ID Format: bw_{tutorId}_{dateSeconds}_{startTime}
        // This ensures that for a specific Tutor, Date, and Time, ONLY ONE booking can exist.
        const bookingId = `bw_${bookingData.tutorId}_${normalizedDate.seconds}_${bookingData.startTime}`;
        const bookingRef = doc(db, 'bookings', bookingId);

        // Check availability strictly by ID
        const existingDoc = await getDoc(bookingRef);

        if (existingDoc.exists()) {
            const existingData = existingDoc.data();
            // If the slot is taken and NOT cancelled, block it.
            if (!['cancelled', 'rejected'].includes(existingData.status)) {
                throw new Error('This time slot is already booked. Please select another time.');
            }
            // If it WAS cancelled, we can overwrite it (proceed to booking creation)
        }

        const startCode = CodeGenerator.generateCompletionCode();

        const booking: Omit<Booking, 'id'> = {
            ...bookingData,
            date: normalizedDate,
            status: 'pending',
            paymentStatus: 'unpaid',
            startCode: startCode,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        console.log('Saving booking to Firestore with ID:', bookingId, booking);

        // Use setDoc to create/overwrite at the specific ID
        await setDoc(bookingRef, booking);

        console.log('Booking saved successfully');

        // Notify Tutor (Non-blocking / Fire-and-forget)
        NotificationService.sendNotification(
            bookingData.tutorId,
            'New Booking Request',
            `You have a new booking request from ${bookingData.studentName}`,
            { bookingId: bookingId, type: 'booking_request' }
        ).catch(err => {
            console.error('Failed to send background notification for booking:', bookingId, err);
        });

        return bookingId;
    }

    // Get single booking by ID
    // Get single booking by ID
    static async getBookingById(bookingId: string): Promise<(Booking & { tutorPhoneNumber?: string; studentPhoneNumber?: string }) | null> {
        try {
            const docRef = doc(db, 'bookings', bookingId);
            const docSnap = await import('firebase/firestore').then(mod => mod.getDoc(docRef));

            if (docSnap.exists()) {
                const data = docSnap.data();
                let tutorPhoneNumber: string | undefined;
                let studentPhoneNumber: string | undefined;

                try {
                    // Fetch Tutor Phone
                    if (data.tutorId) {
                        const tutorDocRef = doc(db, 'users', data.tutorId);
                        const tutorDocSnap = await import('firebase/firestore').then(mod => mod.getDoc(tutorDocRef));
                        if (tutorDocSnap.exists()) {
                            tutorPhoneNumber = tutorDocSnap.data().phoneNumber;
                        }
                    }
                    // Fetch Student Phone
                    if (data.studentId) {
                        const studentDocRef = doc(db, 'users', data.studentId);
                        const studentDocSnap = await import('firebase/firestore').then(mod => mod.getDoc(studentDocRef));
                        if (studentDocSnap.exists()) {
                            studentPhoneNumber = studentDocSnap.data().phoneNumber;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user phone numbers:', error);
                }

                return {
                    id: docSnap.id,
                    ...data,
                    tutorPhoneNumber,
                    studentPhoneNumber
                } as Booking & { tutorPhoneNumber?: string; studentPhoneNumber?: string };
            }
            return null;
        } catch (error) {
            console.error('Error fetching booking:', error);
            return null;
        }
    }

    // Get student's bookings
    static async getStudentBookings(studentId: string): Promise<(Booking & { id: string, tutorPhoneNumber?: string })[]> {
        console.log('getStudentBookings called with studentId:', studentId);

        const q = query(
            collection(db, 'bookings'),
            where('studentId', '==', studentId),
            firestoreOrderBy('date', 'desc')
        );

        console.log('Executing Firestore query for student...');
        const snapshot = await getDocs(q);
        console.log('Student query returned', snapshot.docs.length, 'documents');

        const bookings = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let tutorPhoneNumber: string | undefined;

            try {
                // Fetch tutor's phone number
                if (data.tutorId) {
                    const tutorDocRef = doc(db, 'users', data.tutorId);
                    const tutorDocSnap = await import('firebase/firestore').then(mod => mod.getDoc(tutorDocRef));
                    if (tutorDocSnap.exists()) {
                        tutorPhoneNumber = tutorDocSnap.data().phoneNumber;
                    }
                }
            } catch (error) {
                console.error('Error fetching tutor phone number:', error);
            }

            return {
                id: docSnapshot.id,
                ...data,
                tutorPhoneNumber,
            } as Booking & { id: string, tutorPhoneNumber?: string };
        }));

        return bookings;
    }

    // Get tutor's bookings
    static async getTutorBookings(tutorId: string): Promise<(Booking & { id: string; studentPhoneNumber?: string })[]> {
        console.log('getTutorBookings called with tutorId:', tutorId);

        const q = query(
            collection(db, 'bookings'),
            where('tutorId', '==', tutorId),
            firestoreOrderBy('date', 'desc')
        );

        console.log('Executing Firestore query...');
        const snapshot = await getDocs(q);
        console.log('Query returned', snapshot.docs.length, 'documents');

        const bookings = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let studentPhoneNumber: string | undefined;

            try {
                if (data.studentId) {
                    const studentDocRef = doc(db, 'users', data.studentId);
                    const studentDocSnap = await import('firebase/firestore').then(mod => mod.getDoc(studentDocRef));
                    if (studentDocSnap.exists()) {
                        studentPhoneNumber = studentDocSnap.data().phoneNumber;
                    }
                }
            } catch (error) {
                console.error('Error fetching student phone number:', error);
            }

            return {
                id: docSnapshot.id,
                ...data,
                studentPhoneNumber,
            } as Booking & { id: string; studentPhoneNumber?: string };
        }));

        return bookings;
    }

    // Update booking status
    static async updateBookingStatus(
        bookingId: string,
        status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    ): Promise<void> {
        // const { NotificationService } = await import('@/lib/services/notification.service');

        // Fetch booking to get participants
        const booking = await this.getBookingById(bookingId);

        await updateDoc(doc(db, 'bookings', bookingId), {
            status,
            updatedAt: serverTimestamp(),
        });

        if (booking) {
            if (status === 'confirmed') {
                NotificationService.sendNotification(
                    booking.studentId,
                    'Booking Confirmed',
                    `Your booking with ${booking.tutorName} has been confirmed!`,
                    { bookingId, type: 'booking_status' }
                ).catch(console.error);
            } else if (status === 'completed') {
                NotificationService.sendNotification(
                    booking.studentId,
                    'Service Completed',
                    `Your service with ${booking.tutorName} is marked as completed.`,
                    { bookingId, type: 'booking_status' }
                ).catch(console.error);
            }
        }
    }

    // Cancel booking
    static async cancelBooking(bookingId: string, reason?: string): Promise<void> {
        // const { NotificationService } = await import('@/lib/services/notification.service');
        const booking = await this.getBookingById(bookingId);

        await updateDoc(doc(db, 'bookings', bookingId), {
            status: 'cancelled',
            notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
            updatedAt: serverTimestamp(),
        });

        if (booking) {
            // Notify both parties just in case
            // Fire-and-forget notifications
            Promise.all([
                NotificationService.sendNotification(
                    booking.tutorId,
                    'Booking Cancelled',
                    `Booking with ${booking.studentName} was cancelled.`,
                    { bookingId, type: 'booking_cancelled' }
                ),
                NotificationService.sendNotification(
                    booking.studentId,
                    'Booking Cancelled',
                    `Your booking with ${booking.tutorName} was cancelled.`,
                    { bookingId, type: 'booking_cancelled' }
                )
            ]).catch(err => console.error('Error sending cancellation notifications:', err));
        }
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
    static async getBookedSlots(
        tutorId: string,
        date: Date
    ): Promise<string[]> {
        // Normalize date to midnight
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        const startTimestamp = Timestamp.fromDate(startDate);
        // Note: We use the stored normalized date for exact match if possible,
        // but range query is safer if time components vary slightly.
        // However, we store as normalized midnight date, so exact match on 'date' field should work perfectly
        // if we match how we save it.
        // Let's use exact match on the normalized date provided it matches createBooking logic.

        const q = query(
            collection(db, 'bookings'),
            where('tutorId', '==', tutorId),
            where('date', '==', startTimestamp),
            where('status', 'in', ['pending', 'confirmed', 'in_progress'])
        );

        const snapshot = await getDocs(q);
        const slots = snapshot.docs.map(doc => doc.data().startTime);
        return slots;
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

    // Start job with verification code
    static async startJobWithCode(bookingId: string, code: string): Promise<string> {
        // const { CodeGenerator } = await import('@/lib/utils/code-generator');

        // Get booking to validate code
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDocs(query(collection(db, 'bookings'), where('__name__', '==', bookingId)));

        if (bookingSnap.empty) {
            throw new Error('Booking not found');
        }

        const booking = bookingSnap.docs[0].data() as Booking;

        // Validate start code
        if (!booking.startCode) {
            // Fallback for old bookings without start code
            console.warn('No start code found for booking, allowing start without code');
        } else if (!CodeGenerator.validateCode(code, booking.startCode)) {
            throw new Error('Invalid start code. Please ask customer for the correct code.');
        }

        const completionCode = CodeGenerator.generateCompletionCode();
        const expiresAt = CodeGenerator.getExpirationTime();

        await updateDoc(bookingRef, {
            status: 'in_progress',
            jobStartedAt: serverTimestamp(),
            completionCode: completionCode,
            codeExpiresAt: Timestamp.fromDate(expiresAt),
            codeAttempts: 0,
            updatedAt: serverTimestamp(),
        });

        return completionCode;
    }

    // Complete job with verification code and final bill
    static async completeJob(
        bookingId: string,
        code: string,
        amount: number,
        details: string
    ): Promise<void> {
        // const { CodeGenerator } = await import('@/lib/utils/code-generator');

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
        // const { CodeGenerator } = await import('@/lib/utils/code-generator');

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

    // Mark final bill as paid in cash
    static async markFinalBillPaidInCash(bookingId: string): Promise<void> {
        await updateDoc(doc(db, 'bookings', bookingId), {
            finalPaymentStatus: 'completed',
            paymentMethod: 'cash',
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }
}
