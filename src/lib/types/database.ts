import { Timestamp } from 'firebase/firestore';

// User Roles
export type UserRole = 'student' | 'tutor' | 'admin';

// Base User
export interface User {
    uid: string;
    email: string;
    role: UserRole;
    createdAt: Timestamp;
    studentProfile?: StudentProfile;
    tutorProfile?: TutorProfile;
    fcmTokens?: string[]; // Firebase Cloud Messaging tokens for push notifications
    notificationSettings?: NotificationSettings;
    phoneNumber?: string;
}

// Notification Settings
export interface NotificationSettings {
    enabled: boolean;
    messages: boolean;
    verifications: boolean;
    subscriptions: boolean;
    admin: boolean;
}

// Student Profile
export interface StudentProfile {
    firstName: string;
    lastName: string;
    gender: string;
    city: string;
    address?: string;
    favorites: string[]; // tutor UIDs
    profilePicture?: string; // Storage URL
    grade?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

// Tutor Profile
export interface TutorProfile {
    firstName: string;
    lastName: string;
    bio: string;
    subjects: string[];
    grades: string[];
    hourlyRate: number;
    experience: number; // years
    teachingType: ('online' | 'in-person' | 'both')[];
    gender: string;
    city: string;
    area: string;
    category?: string;
    address?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    profilePicture?: string; // Storage URL
    introVideo?: string; // Storage URL
    verified: boolean;
    kyc?: KYCData;
    verificationDocuments: string[]; // Legacy, keep for backward compatibility if needed
    rejectionReason?: string; // Admin rejection reason
    averageRating: number;
    totalRatings: number;
    profileViews: number;
    subscription: SubscriptionStatus;
    isActivated?: boolean; // Controls global visibility (Provider controlled)
    isSuspended?: boolean; // Controls access to app (Admin controlled)
}

export interface KYCData {
    idProofUrl: string;
    idNumber?: string;
    photoUrl?: string; // Captured photo
    addressProofUrl?: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    rejectionReason?: string;
    idType?: string; // Added to match usage in tutor.service.ts
}

// Subscription Status
export interface SubscriptionStatus {
    plan: 'monthly' | 'quarterly' | 'yearly' | null;
    status: 'active' | 'expired' | 'pending';
    startDate: Timestamp | null;
    endDate: Timestamp | null;
}

// Chat
export interface Chat {
    id: string;
    participants: string[]; // [studentUID, tutorUID]
    lastMessage: string;
    lastMessageTime: Timestamp;
    unreadCount: { [uid: string]: number };
    bookingId?: string; // Link to specific booking
}

// Message
export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Timestamp;
    read: boolean;
}

// Rating
export interface Rating {
    id: string;
    studentId: string;
    tutorId: string;
    stars: number; // 1-5
    comment?: string;
    timestamp: Timestamp;
    sessionId?: string;
}

// Interested Student
export interface InterestedStudent {
    id: string;
    tutorId: string;
    studentId: string;
    action: 'profile_view' | 'search_result' | 'marked_interested';
    timestamp: Timestamp;
    studentInfo: {
        firstName: string;
        grade: string;
        city: string;
    };
}

// News
export interface News {
    id: string;
    title: string;
    content: string;
    type: 'update' | 'alert' | 'general';
    breaking: boolean;
    publishedAt: Timestamp;
    authorId: string;
}

// Complaint
export interface Complaint {
    id: string;
    reporterId: string;
    reporterRole: 'student' | 'tutor';
    reportedId?: string;
    issue: string;
    description: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    adminNotes?: string;
}

// Suspension Appeal (Provider Appeal)
export interface SuspensionAppeal {
    id: string;
    userId: string;
    mobile: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    adminNotes?: string;
    userEmail?: string; // Denormalized for easy display
    userName?: string; // Denormalized for easy display
}

// Subscription Record
export interface Subscription {
    id: string;
    tutorId: string;
    plan: 'monthly' | 'quarterly' | 'yearly';
    amount: number;
    status: 'active' | 'pending' | 'expired';
    paymentMethod: string;
    startDate: Timestamp;
    endDate: Timestamp;
    stripeSubscriptionId?: string;
}

// Search Filters
export interface TutorSearchFilters {
    subject?: string;
    grade?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    teachingType?: 'online' | 'in-person';
    gender?: string;
}

// Time Slot
export interface TimeSlot {
    start: string; // "HH:mm" format, e.g. "14:00"
    end: string; // "HH:mm" format, e.g. "15:30"
}

// Booking
export interface Booking {
    id: string;
    studentId: string;
    tutorId: string;

    // Session Details
    date: Timestamp;
    startTime: string; // "14:00"
    endTime: string; // "15:30"
    duration: number; // minutes (30, 60, 90, 120)

    // Pricing
    hourlyRate: number;
    totalPrice: number;

    // Status
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

    // Payment
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    paymentIntentId?: string;

    // Metadata
    subject?: string;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Denormalized for easy display
    studentName?: string;
    tutorName?: string;
    address?: string;

    // Job completion verification fields
    startCode?: string;                // 6-digit random code to start job
    completionCode?: string;           // 6-digit random code
    jobStartedAt?: Timestamp;          // When provider started work
    jobCompletedAt?: Timestamp;        // When job was completed
    codeExpiresAt?: Timestamp;         // Code expiration time (24h from start)
    codeAttempts?: number;             // Failed verification attempts

    // Final billing fields (after job completion)
    finalBillAmount?: number;          // Total amount quoted by provider (including ₹99)
    billDetails?: string;              // Description of work done and materials
    billSubmittedAt?: Timestamp;       // When provider submitted final bill

    // Final payment tracking (deferred payment)
    finalPaymentId?: string;           // Razorpay payment ID for final payment
    finalPaymentStatus?: 'pending' | 'completed' | 'failed';
    paidAt?: Timestamp;                // When final payment was completed
    paymentMethod?: 'cash' | 'online'; // Method of final payment

    // Rating tracking
    rated?: boolean;                   // Has customer rated this service
}

// Tutor Availability
export interface TutorAvailability {
    id: string;
    tutorId: string;

    // Weekly recurring schedule
    weeklySchedule: {
        monday?: TimeSlot[];
        tuesday?: TimeSlot[];
        wednesday?: TimeSlot[];
        thursday?: TimeSlot[];
        friday?: TimeSlot[];
        saturday?: TimeSlot[];
        sunday?: TimeSlot[];
    };

    // Specific date overrides (for holidays, special hours, etc.)
    dateOverrides?: {
        [date: string]: TimeSlot[] | 'unavailable'; // "2024-12-25": "unavailable"
    };

    // Session duration options tutor offers
    sessionDurations: number[]; // [30, 60, 90, 120] in minutes

    // Break time between sessions
    breakDuration: number; // minutes

    updatedAt: Timestamp;
}
