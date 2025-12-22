import { FirestoreREST } from '@/lib/firebase/nativeFirestore';
import { Booking } from '@/lib/types/database';
import { CodeGenerator } from '@/lib/utils/code-generator';
import { NotificationService } from '@/lib/services/notification.service';
import { User } from '@/lib/types/database';

// Helper to convert timestamp to Date (handles both Firebase Timestamp and plain object)
const toDateSafe = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
};

export class BookingService {
    // Create a new booking
    static async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        console.log('BookingService.createBooking called with data:', bookingData);

        // Normalize date to midnight - handle both Timestamp and Date objects
        const dateObj = toDateSafe(bookingData.date);
        dateObj.setHours(0, 0, 0, 0);
        const normalizedDateSeconds = Math.floor(dateObj.getTime() / 1000);

        // Deterministic ID for duplicate prevention
        const bookingId = `bw_${bookingData.tutorId}_${normalizedDateSeconds}_${bookingData.startTime}`;

        // Check availability
        const existingDoc = await FirestoreREST.getDoc<Booking>('bookings', bookingId);
        if (existingDoc && !['cancelled', 'rejected'].includes(existingDoc.status)) {
            throw new Error('This time slot is already booked. Please select another time.');
        }

        const startCode = CodeGenerator.generateCompletionCode();

        const booking = {
            ...bookingData,
            date: { seconds: normalizedDateSeconds, nanoseconds: 0 },
            status: 'pending',
            paymentStatus: 'unpaid',
            startCode: startCode,
            createdAt: FirestoreREST.serverTimestamp(),
            updatedAt: FirestoreREST.serverTimestamp(),
        };

        console.log('Saving booking to Firestore with ID:', bookingId);
        await FirestoreREST.setDoc('bookings', bookingId, booking);
        console.log('Booking saved successfully');

        // Notify Tutor (Fire-and-forget)
        NotificationService.sendNotification(
            bookingData.tutorId,
            'New Booking Request',
            `You have a new booking request from ${bookingData.studentName}`,
            { bookingId: bookingId, type: 'booking_request' }
        ).catch(console.error);

        return bookingId;
    }

    // Cache for user phone numbers
    private static phoneCache = new Map<string, string>();

    private static async getPhoneNumber(userId: string): Promise<string | undefined> {
        if (this.phoneCache.has(userId)) return this.phoneCache.get(userId);

        try {
            const user = await FirestoreREST.getDoc<User>('users', userId);
            const phone = user?.phoneNumber;
            if (phone) this.phoneCache.set(userId, phone);
            return phone;
        } catch (e) {
            console.error("Error fetching phone for", userId, e);
            return undefined;
        }
    }

    // Get single booking by ID
    static async getBookingById(bookingId: string): Promise<(Booking & { tutorPhoneNumber?: string; studentPhoneNumber?: string }) | null> {
        try {
            const booking = await FirestoreREST.getDoc<Booking>('bookings', bookingId);
            if (!booking) return null;

            let tutorPhoneNumber: string | undefined;
            let studentPhoneNumber: string | undefined;

            try {
                if (booking.tutorId) tutorPhoneNumber = await this.getPhoneNumber(booking.tutorId);
                if (booking.studentId) studentPhoneNumber = await this.getPhoneNumber(booking.studentId);
            } catch (error) {
                console.error('Error fetching user phone numbers:', error);
            }

            return { ...booking, tutorPhoneNumber, studentPhoneNumber };
        } catch (error) {
            console.error('Error fetching booking:', error);
            return null;
        }
    }

    // Get student's bookings
    static async getStudentBookings(studentId: string): Promise<(Booking & { id: string, tutorPhoneNumber?: string })[]> {
        console.log('getStudentBookings called with studentId:', studentId);

        const bookings = await FirestoreREST.query<Booking>('bookings', {
            where: [{ field: 'studentId', op: 'EQUAL', value: studentId }],
            orderBy: [{ field: 'date', direction: 'DESCENDING' }]
        });

        // Fetch phone numbers
        const results = await Promise.all(bookings.map(async (booking) => {
            let tutorPhoneNumber: string | undefined;
            if (booking.tutorId) {
                tutorPhoneNumber = await this.getPhoneNumber(booking.tutorId);
            }
            return { ...booking, tutorPhoneNumber };
        }));

        return results;
    }

    // Polling-based listener for student bookings (call this with setInterval)
    static async fetchStudentBookings(studentId: string): Promise<(Booking & { id: string, tutorPhoneNumber?: string })[]> {
        return this.getStudentBookings(studentId);
    }

    // Get tutor's bookings
    static async getTutorBookings(tutorId: string): Promise<(Booking & { id: string; studentPhoneNumber?: string })[]> {
        console.log('getTutorBookings called with tutorId:', tutorId);

        const bookings = await FirestoreREST.query<Booking>('bookings', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }],
            orderBy: [{ field: 'date', direction: 'DESCENDING' }]
        });

        // Fetch phone numbers
        const results = await Promise.all(bookings.map(async (booking) => {
            let studentPhoneNumber: string | undefined;
            if (booking.studentId) {
                studentPhoneNumber = await this.getPhoneNumber(booking.studentId);
            }
            return { ...booking, studentPhoneNumber };
        }));

        return results;
    }

    // Polling-based listener for tutor bookings
    static async fetchTutorBookings(tutorId: string): Promise<(Booking & { id: string; studentPhoneNumber?: string })[]> {
        return this.getTutorBookings(tutorId);
    }

    // Update booking status
    static async updateBookingStatus(
        bookingId: string,
        status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    ): Promise<void> {
        const booking = await this.getBookingById(bookingId);

        await FirestoreREST.updateDoc('bookings', bookingId, {
            status,
            updatedAt: FirestoreREST.serverTimestamp(),
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
        const booking = await this.getBookingById(bookingId);

        await FirestoreREST.updateDoc('bookings', bookingId, {
            status: 'cancelled',
            notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
            updatedAt: FirestoreREST.serverTimestamp(),
        });

        if (booking) {
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
            ]).catch(console.error);
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
            updatedAt: FirestoreREST.serverTimestamp(),
        };

        if (paymentIntentId) updateData.paymentIntentId = paymentIntentId;
        if (paymentStatus === 'paid') updateData.status = 'confirmed';

        await FirestoreREST.updateDoc('bookings', bookingId, updateData);
    }

    // Get booked slots for a date
    static async getBookedSlots(tutorId: string, date: Date): Promise<string[]> {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const dateSeconds = Math.floor(startDate.getTime() / 1000);

        // Query bookings for this tutor and date
        const bookings = await FirestoreREST.query<Booking>('bookings', {
            where: [
                { field: 'tutorId', op: 'EQUAL', value: tutorId },
            ]
        });

        // Filter by date and status client-side (REST API doesn't support IN operator well)
        const activeStatuses = ['pending', 'confirmed', 'in_progress', 'completed'];
        return bookings
            .filter(b => {
                const bookingDateSeconds = (b.date as any)?.seconds || 0;
                return bookingDateSeconds === dateSeconds && activeStatuses.includes(b.status);
            })
            .map(b => b.startTime);
    }

    // Get bookings for date range
    static async getBookingsForDateRange(
        tutorId: string,
        startDate: Date,
        endDate: Date
    ): Promise<(Booking & { id: string })[]> {
        const bookings = await FirestoreREST.query<Booking>('bookings', {
            where: [{ field: 'tutorId', op: 'EQUAL', value: tutorId }]
        });

        const startSeconds = Math.floor(startDate.getTime() / 1000);
        const endSeconds = Math.floor(endDate.getTime() / 1000);

        return bookings.filter(b => {
            const dateSeconds = (b.date as any)?.seconds || 0;
            return dateSeconds >= startSeconds && dateSeconds <= endSeconds;
        });
    }

    // Start job with verification code
    static async startJobWithCode(bookingId: string, code: string): Promise<string> {
        const booking = await this.getBookingById(bookingId);
        if (!booking) throw new Error('Booking not found');

        if (booking.startCode && !CodeGenerator.validateCode(code, booking.startCode)) {
            throw new Error('Invalid start code. Please ask customer for the correct code.');
        }

        const completionCode = CodeGenerator.generateCompletionCode();
        const expiresAt = CodeGenerator.getExpirationTime();

        await FirestoreREST.updateDoc('bookings', bookingId, {
            status: 'in_progress',
            jobStartedAt: FirestoreREST.serverTimestamp(),
            completionCode: completionCode,
            codeExpiresAt: { seconds: Math.floor(expiresAt.getTime() / 1000), nanoseconds: 0 },
            codeAttempts: 0,
            updatedAt: FirestoreREST.serverTimestamp(),
        });

        NotificationService.sendNotification(
            booking.studentId,
            'Job Started',
            `Your service with ${booking.tutorName} has started!`,
            { bookingId, type: 'job_started' }
        ).catch(console.error);

        return completionCode;
    }

    // Complete job with verification code and final bill
    static async completeJob(
        bookingId: string,
        code: string,
        amount: number,
        details: string
    ): Promise<void> {
        const booking = await this.getBookingById(bookingId);
        if (!booking) throw new Error('Booking not found');

        if (!booking.completionCode) {
            throw new Error('No completion code found. Please start the job first.');
        }

        if (!CodeGenerator.validateCode(code, booking.completionCode)) {
            const attempts = (booking.codeAttempts || 0) + 1;
            await FirestoreREST.updateDoc('bookings', bookingId, {
                codeAttempts: attempts,
                updatedAt: FirestoreREST.serverTimestamp()
            });

            if (attempts >= 3) {
                throw new Error('Too many failed attempts. Please ask customer to regenerate code.');
            }
            throw new Error(`Invalid completion code. ${3 - attempts} attempts remaining.`);
        }

        if (booking.codeExpiresAt && CodeGenerator.isExpired(new Date((booking.codeExpiresAt as any).seconds * 1000))) {
            throw new Error('Completion code expired. Please ask customer to regenerate code.');
        }

        if (amount <= 0) throw new Error('Bill amount must be greater than 0');

        await FirestoreREST.updateDoc('bookings', bookingId, {
            status: 'completed',
            jobCompletedAt: FirestoreREST.serverTimestamp(),
            finalBillAmount: amount,
            billDetails: details,
            billSubmittedAt: FirestoreREST.serverTimestamp(),
            finalPaymentStatus: 'pending',
            updatedAt: FirestoreREST.serverTimestamp(),
        });

        NotificationService.sendNotification(
            booking.studentId,
            'Job Completed',
            `Your service is complete. Final Bill: ₹${amount}`,
            { bookingId, type: 'job_completed' }
        ).catch(console.error);
    }

    // Regenerate completion code
    static async regenerateCompletionCode(bookingId: string): Promise<string> {
        const newCode = CodeGenerator.generateCompletionCode();
        const expiresAt = CodeGenerator.getExpirationTime();

        await FirestoreREST.updateDoc('bookings', bookingId, {
            completionCode: newCode,
            codeExpiresAt: { seconds: Math.floor(expiresAt.getTime() / 1000), nanoseconds: 0 },
            codeAttempts: 0,
            updatedAt: FirestoreREST.serverTimestamp(),
        });

        return newCode;
    }

    // Update final payment status
    static async updateFinalPaymentStatus(
        bookingId: string,
        paymentId: string,
        status: 'completed' | 'failed'
    ): Promise<void> {
        const updateData: any = {
            finalPaymentId: paymentId,
            finalPaymentStatus: status,
            updatedAt: FirestoreREST.serverTimestamp(),
        };

        if (status === 'completed') {
            updateData.paidAt = FirestoreREST.serverTimestamp();
        }

        await FirestoreREST.updateDoc('bookings', bookingId, updateData);
    }

    // Mark final bill as paid in cash
    static async markFinalBillPaidInCash(bookingId: string): Promise<void> {
        await FirestoreREST.updateDoc('bookings', bookingId, {
            finalPaymentStatus: 'completed',
            paymentMethod: 'cash',
            paidAt: FirestoreREST.serverTimestamp(),
            updatedAt: FirestoreREST.serverTimestamp(),
        });
    }

    // Legacy listener methods - now use polling approach
    // Components should use useEffect + setInterval to call fetch methods instead
    static listenToBooking(bookingId: string, callback: (booking: any) => void): () => void {
        // Initial fetch
        this.getBookingById(bookingId).then(callback);

        // Poll every 5 seconds
        const interval = setInterval(() => {
            this.getBookingById(bookingId).then(callback);
        }, 5000);

        return () => clearInterval(interval);
    }

    static listenToStudentBookings(studentId: string, callback: (bookings: any[]) => void): () => void {
        this.getStudentBookings(studentId).then(callback);
        const interval = setInterval(() => {
            this.getStudentBookings(studentId).then(callback);
        }, 5000);
        return () => clearInterval(interval);
    }

    static listenToTutorBookings(tutorId: string, callback: (bookings: any[]) => void): () => void {
        this.getTutorBookings(tutorId).then(callback);
        const interval = setInterval(() => {
            this.getTutorBookings(tutorId).then(callback);
        }, 5000);
        return () => clearInterval(interval);
    }
}
