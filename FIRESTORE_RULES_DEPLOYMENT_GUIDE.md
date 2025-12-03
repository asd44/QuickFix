# Firestore Rules Deployment & Testing Guide

## Step 1: Verify Current Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **quickfix-v1** project
3. Navigate to **Firestore Database** → **Rules**
4. Check what rules are currently showing

---

## Step 2: Deploy the Correct Rules

### Copy these EXACT rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles (for provider search)
      allow read: if request.auth != null;
      
      // Users can write their own data (including FCM tokens)
      // Admins can write any user data
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // Allow updating FCM tokens (for push notifications)
      allow update: if request.auth != null && request.auth.uid == userId &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fcmToken', 'fcmTokens', 'lastSeen', 'isOnline']);
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
      // Customer, provider, or admin can update bookings
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
      // Allow creating new chats
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

### Deployment Steps:
1. **Select ALL text** in the Firebase rules editor
2. **Delete** everything
3. **Paste** the rules above
4. **Click "Publish"** button
5. **Wait 30 seconds** for rules to propagate

---

## Step 3: Test Rules Using Firebase Console

After publishing, test if rules work:

1. Go to **Firestore Database** → **Rules** → **Rules Playground** tab
2. Test this simulation:

**Simulation 1: Read User Profile**
- Location: `/users/test-user-id`
- Auth Provider: `Custom`
- Auth UID: `your-actual-uid`
- Operation: `get`
- Click **"Run"**
- Should show: ✅ **Allowed**

**Simulation 2: Unauthenticated Access**
- Location: `/users/test-user-id`
- Auth Provider: `Unauthenticated`
- Operation: `get`
- Click **"Run"**
- Should show: ❌ **Denied**

---

## Step 4: Clear Browser Cache & Sign Out

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Application** → **Storage** → **Clear site data**
3. **Sign out** of QuickFix
4. **Close** all browser tabs
5. **Reopen** and sign in again

---

## Step 5: Verify User Document Exists

1. Go to **Firestore Database** → **Data** tab
2. Open `users` collection
3. Find your user document (search by your email or UID)
4. Verify it has:
   - `uid`: (your auth UID)
   - `email`: (your email)
   - `role`: "admin" (or "student"/"tutor")

If document is missing, the app can't load user data!

---

## Step 6: Check Browser Console for Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors like:
   - "Missing or insufficient permissions"
   - "Document doesn't exist"
   - Any Firebase errors

**Copy any errors** and share them.

---

## Troubleshooting

### Error still persists after deployment?

Try these:

**Option 1: Hard Refresh**
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5`

**Option 2: Incognito/Private Mode**
- Open new incognito window
- Navigate to `http://localhost:3000`
- Sign in again

**Option 3: Check Firebase Project**
- Are you looking at the **correct** Firebase project?
- Project ID should be: `quickfix-v1`
- Check top-left of Firebase Console

**Option 4: Wait Longer**
- Sometimes rules take 1-2 minutes to fully propagate
- Wait 2 minutes, then try again

---

## If Still Not Working

Share these details:

1. **Screenshot** of Firebase Console → Firestore → Rules (showing published rules)
2. **Browser console errors** (full error message)
3. **Firestore document** screenshot (your user document)
4. **Auth status** - Are you logged in? Check Firebase Console → Authentication → Users

---

## Quick Test Command (Browser Console)

Run this in browser console to test auth:

```javascript
// Check if user is logged in
firebase.auth().currentUser
// Should show: { uid: "...", email: "..." }

// If null, you're not logged in!
```

---

**Expected Result:** After correct deployment + cache clear + re-login, the app should work without permission errors!
