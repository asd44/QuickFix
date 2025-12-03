# SIMPLIFIED Firestore Rules - Testing Version

**Use these simplified rules to diagnose the issue:**

## Deploy These Rules to Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // SIMPLIFIED - Allow all authenticated users to read/write for testing
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Why This Works:

This is a **permissive test rule** that allows ANY authenticated user to read/write ANY document. This will help us identify if the issue is:
1. ❌ Rules too restrictive
2. ✅ Something else (auth, network, etc.)

## Steps:

1. **Deploy** these simplified rules to Firebase Console
2. **Click "Publish"**
3. **Wait 30 seconds**
4. **Clear browser cache** (Ctrl+Shift+R)
5. **Sign in again**

## Expected Result:

- ✅ **If it works:** The problem was with the rules. We'll then tighten them.
- ❌ **If it still fails:** The problem is somewhere else (auth config, network, etc.)

---

## After Testing - Deploy Production Rules:

Once it works with simplified rules, deploy the production rules from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // All other collections
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
    
    match /chats/{chatId}/messages/{messageId} {
      allow read, create: if request.auth != null;
    }
    
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /interestedStudents/{docId} {
      allow read, create: if request.auth != null;
    }
  }
}
```

---

**Try the simplified rules FIRST to confirm Firebase is working!**
