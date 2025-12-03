# CORRECTED Firestore Security Rules for QuickFix

**Important:** Use these updated rules instead of the ones currently in FIREBASE_SETUP.md

## Copy these rules to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles (for provider search)
      allow read: if request.auth != null;
      // Users can only write their own data OR admins can write
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Bookings collection (service appointments)
    match /bookings/{bookingId} {
      // Users can read their own bookings OR admins can read all
      allow read: if request.auth != null && (
        resource.data.studentId == request.auth.uid ||
        resource.data.tutorId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      // Only customers can create bookings
      allow create: if request.auth != null && 
        request.resource.data.studentId == request.auth.uid;
      // Customer, provider, or admin can update
      allow update: if request.auth != null && (
        resource.data.studentId == request.auth.uid ||
        resource.data.tutorId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
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
      // Anyone authenticated can read ratings
      allow read: if request.auth != null;
      // Only customers can create ratings
      allow create: if request.auth != null && 
        request.resource.data.studentId == request.auth.uid;
    }
    
    // Subscriptions collection (provider subscriptions)
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null;
      // Only admins can write subscriptions
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Interested students/customers (leads for providers)
    match /interestedStudents/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Key Changes Made:

1. **Removed duplicate `allow read` rules** - Combined them with OR conditions
2. **Fixed admin check** - Inline `get()` calls instead of helper function
3. **Simplified logic** - Easier to read and maintain
4. **Added `allow create` for chats** - Was missing before

## How to Deploy:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **quickfix-v1** project
3. Navigate to **Firestore Database** → **Rules**
4. **Delete** all existing rules
5. **Copy and paste** the rules above
6. Click **"Publish"**

## Test After Deployment:

- ✅ Login as user
- ✅ View user profile
- ✅ Create booking
- ✅ Send messages
- ✅ Admin can access all data

---

**Note:** The previous rules had duplicate conditions which could cause undefined behavior. These corrected rules are cleaner and will work properly.
