# Firebase Setup for QuickFix

This document provides a comprehensive guide to setting up Firebase for the QuickFix home services marketplace application.

## Overview

QuickFix is a service marketplace platform connecting customers with verified home service providers (electricians, plumbers, carpenters, etc.) across India. The platform uses Firebase for:
- **Authentication:** User sign-up/login for customers and service providers
- **Firestore:** Real-time database for user profiles, bookings, ratings, and messages
- **Storage:** File uploads (verification documents, profile pictures)
- **Analytics:** User behavior tracking

## Prerequisites

- Google/Firebase account
- Node.js 16+ installed
- Basic understanding of Firebase services

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `quickfix-services` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Choose Analytics location: **India**
6. Click **"Create project"**

---

## Step 2: Register Web App

1. In your Firebase project, click **"Add app"** → Web (`</>` icon)
2. App nickname: `QuickFix Web App`
3. **Do NOT** enable Firebase Hosting yet
4. Click **"Register app"**
5. **Copy the Firebase configuration object** — you'll need this for Step 5

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "quickfix-services.firebaseapp.com",
  projectId: "quickfix-services",
  storageBucket: "quickfix-services.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCAOSo7Adz8GP1ugCrfYqYZsp9K8Q6K35I",
  authDomain: "quickfix-v1.firebaseapp.com",
  projectId: "quickfix-v1",
  storageBucket: "quickfix-v1.firebasestorage.app",
  messagingSenderId: "739661928860",
  appId: "1:739661928860:web:45be650be9cf42a9e49059",
  measurementId: "G-2GHTLZDYSK"
};
---

## Step 3: Enable Authentication

### 3.1 Enable Email/Password Authentication
1. Go to **Authentication** → **Sign-in method**
2. Click **"Email/Password"**
3. **Enable** the first option (Email/Password)
4. Click **"Save"**

### 3.2 Enable Google Sign-In (Optional)
1. In the same **Sign-in method** tab
2. Click **"Google"**
3. Enable and configure
4. Add support email
5. Click **"Save"**

### 3.3 Add Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g., `quickfix.in`)
3. `localhost` is already authorized for development

---

## Step 4: Set Up Firestore Database

### 4.1 Create Database
1. Go to **Firestore Database**
2. Click **"Create database"**
3. Start in **production mode** (we'll add security rules next)
4. Choose location: **asia-south1 (Mumbai)** for low latency in India
5. Click **"Enable"**

### 4.2 Configure Security Rules

Go to **Firestore Database** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles (for provider search)
      allow read: if request.auth != null;
      // Users can only write their own data
      allow write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all
      allow read: if isAdmin();
    }
    
    // Bookings collection (service appointments)
    match /bookings/{bookingId} {
      // Users can only read their own bookings
      allow read: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         resource.data.tutorId == request.auth.uid);
      // Only customers can create bookings
      allow create: if request.auth != null && 
        request.resource.data.studentId == request.auth.uid;
      // Both customer and provider can update bookings
      allow update: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         resource.data.tutorId == request.auth.uid);
      // Admins can read all
      allow read: if isAdmin();
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Messages subcollection
    match /chats/{chatId}/messages/{messageId} {
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
    }
    
    // Ratings collection
    match /ratings/{ratingId} {
      // Anyone can read ratings
      allow read: if request.auth != null;
      // Only customers can create ratings for providers they've used
      allow create: if request.auth != null && 
        request.resource.data.studentId == request.auth.uid;
    }
    
    // Subscriptions collection (provider subscriptions)
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Interested students/customers (leads for providers)
    match /interestedStudents/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

Click **"Publish"** to save the rules.

---

## Step 5: Set Up Cloud Storage

### 5.1 Create Storage Bucket
1. Go to **Storage**
2. Click **"Get started"**
3. Start in **production mode**
4. Choose location: **asia-south1**
5. Click **"Done"**

### 5.2 Configure Storage Rules

Go to **Storage** → **Rules** and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Verification documents (service provider credentials)
    match /verification/{userId}/{allPaths=**} {
      // Anyone can read (for admin verification)
      allow read: if request.auth != null;
      // Only the user can upload their documents
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profile pictures
    match /profiles/{userId}/{allPaths=**} {
      // Anyone can view profile pictures
      allow read: if true;
      // Only the user can upload their profile picture
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat attachments
    match /chats/{chatId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Click **"Publish"** to save the rules.

---

## Step 6: Configure Environment Variables

### 6.1 Create `.env.local` File

In your project root, create a file named `.env.local`:

```env
# QuickFix Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=quickfix-services.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=quickfix-services
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=quickfix-services.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Razorpay Configuration (for Rs 99 visiting charge payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-test-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

Replace the values with your actual Firebase config from Step 2.

### 6.2 Update `.gitignore`

Ensure `.env.local` is in your `.gitignore`:

```
# Environment variables
.env.local
.env*.local
```

**⚠️ NEVER commit `.env.local` to Git!**

---

## Step 7: Initialize Firebase in Your App

The Firebase configuration is already set up in `src/lib/firebase.ts`. Verify it uses environment variables:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Firestore Data Structure

### Collections Overview

QuickFix uses the following Firestore collections:

| Collection | Purpose |
|------------|---------|
| `users` | Customer and service provider profiles |
| `bookings` | Service inspection bookings (Rs 99 visiting charge) |
| `chats` | Chat rooms between customers and providers |
| `chats/{chatId}/messages` | Individual messages |
| `ratings` | Provider ratings and reviews |
| `subscriptions` | Provider subscription records |
| `interestedStudents` | Customer leads for providers |

### Users Collection Structure

```javascript
{
  uid: "user123",
  email: "customer@example.com",
  role: "student", // "student" (customer) or "tutor" (provider) or "admin"
  createdAt: Timestamp,
  
  // Customer Profile (role: "student")
  studentProfile: {
    firstName: "Priya",
    lastName: "Sharma",
    city: "Mumbai",
    favorites: ["providerId1", "providerId2"] // Saved providers
  },
  
  // Service Provider Profile (role: "tutor")
  tutorProfile: {
    firstName: "Rajesh",
    lastName: "Kumar",
    gender: "Male",
    city: "Mumbai",
    area: "Andheri West",
    subjects: ["Electrical", "Plumbing"], // Service categories
    grades: ["Installation", "Repair"], // Service types
    bio: "Expert electrician with 10+ years of experience",
    hourlyRate: 99, // Fixed visiting charge (Rs 99)
    experience: 10,
    verified: false, // Admin verification status
    profileViews: 0,
    averageRating: 0,
    totalRatings: 0,
    verificationDocuments: [], // URLs of uploaded documents
    profilePicture: "",
    teachingType: ["On-site"], // Always on-site for services
    subscription: {
      status: "inactive", // "active" or "inactive"
      plan: "basic", // "basic" or "premium"
      startDate: Timestamp,
      endDate: Timestamp
    },
    rejectionReason: "" // If verification rejected
  }
}
```

### Bookings Collection Structure

```javascript
{
  id: "booking123",
  studentId: "customer-uid",
  tutorId: "provider-uid",
  studentName: "Priya Sharma",
  tutorName: "Rajesh Kumar",
  date: Timestamp,
  startTime: "10:00 AM",
  endTime: "11:00 AM",
  duration: 60, // minutes
  hourlyRate: 99, // Fixed visiting charge
  totalPrice: 99, // Always Rs 99 for inspection
  status: "pending", // "pending", "confirmed", "completed", "cancelled"
  paymentStatus: "unpaid", // "unpaid", "paid"
  notes: "Need inspection for ceiling fan installation",
  subject: "Electrical", // Service category
  createdAt: Timestamp
}
```

**Note:** The `hourlyRate` field is kept at 99 for all bookings. This represents the visiting/inspection charge only. Actual service charges are quoted on-site after inspection.

---

## Testing Your Setup

### 1. Test Authentication
```bash
npm run dev
```
- Navigate to `http://localhost:3000/auth/signup`
- Create a customer account
- Create a service provider account
- Verify users appear in Firebase Console → Authentication

### 2. Test Firestore
- Sign in as a customer
- Browse service providers
- Verify user data is saved in Firestore → users collection

### 3. Test Storage
- Sign in as a service provider
- Go to Settings/Verification
- Upload a profile picture or verification document
- Verify file appears in Storage → profiles or verification folder

---

## Common Issues & Solutions

### Issue: "Firebase App not initialized"
**Solution:** Ensure `.env.local` exists and contains all required variables. Restart dev server.

### Issue: "Permission denied" errors
**Solution:** Check Firestore security rules. Make sure you're authenticated.

### Issue: "Storage upload fails"
**Solution:** Verify Storage rules allow uploads. Check file size limits (5MB default).

### Issue: Can't see other users
**Solution:** Firestore rules require authentication. Ensure you're logged in.

---

## Production Considerations

Before deploying to production:

1. **Update Security Rules:** Review and tighten rules for production
2. **Enable App Check:** Protect your backend from abuse
3. **Set up Billing:** Enable Blaze plan for production usage
4. **Configure Backups:** Set up automated Firestore backups
5. **Monitor Usage:** Set up budget alerts
6. **Add Custom Domain:** Configure custom domain in Firebase Hosting
7. **Enable Performance Monitoring:** Track app performance

---

## Service Categories

QuickFix supports the following service categories:

1. ⚡ **Electrical** - Wiring, installations, repairs
2. 🚰 **Plumbing** - Pipe repairs, installations
3. 🪚 **Carpentry** - Furniture, woodwork
4. 🧹 **Cleaning** - Home cleaning services
5. 🎨 **Painting** - Wall painting, touch-ups
6. 🔌 **Appliance Repair** - AC, refrigerator, washing machine
7. 🐜 **Pest Control** - Termite, cockroach control
8. 🏠 **Home Maintenance** - General repairs

Each category supports:
- **Installation** - New equipment/fixtures
- **Repair** - Fix existing issues
- **Maintenance** - Regular upkeep
- **Emergency Service** - Urgent repairs

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Storage](https://firebase.google.com/docs/storage)

---

## Support

For QuickFix-specific issues, contact:
- Email: admin@quickfix.in
- Technical Support: dev@quickfix.in

**Last Updated:** December 2025
