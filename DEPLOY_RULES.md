# Deploying Firebase Security Rules

## Issue: "Missing or insufficient permissions"

This error occurs because the Firestore security rules haven't been deployed to your Firebase project yet.

---

## Solution: Deploy the Rules

### Method 1: Firebase Console (Easiest)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select your TutorLink project

2. **Navigate to Firestore Rules:**
   - Click **Firestore Database** in the left menu
   - Click the **Rules** tab at the top

3. **Copy and paste these rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }
    
    match /chats/{chatId} {
      allow read, create, update: if isAuthenticated() && 
                     request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, create: if isAuthenticated();
      }
    }
    
    match /ratings/{ratingId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && isOwner(resource.data.studentId);
    }
    
    match /interestedStudents/{recordId} {
      allow read: if isAuthenticated() && isOwner(resource.data.tutorId);
      allow create: if isAuthenticated();
    }
    
    match /news/{newsId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    match /complaints/{complaintId} {
      allow read: if isAuthenticated() && (isOwner(resource.data.reporterId) || isAdmin());
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    match /subscriptions/{subscriptionId} {
      allow read: if isAuthenticated() && (isOwner(resource.data.tutorId) || isAdmin());
      allow create, update: if isAdmin();
    }
  }
}
```

4. **Click "Publish"** to deploy the rules

5. **Refresh your app** and try signing up again!

---

### Method 2: Firebase CLI (Advanced)

If you want to use the command line:

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

3. **Initialize Firebase (if not done):**
```bash
firebase init
```
   - Select **Firestore** and **Storage**
   - Choose your existing project
   - Accept default file locations

4. **Deploy rules:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## Quick Test Rules (For Development Only)

If you just want to test quickly, you can temporarily use these permissive rules:

**⚠️ WARNING: DO NOT USE IN PRODUCTION!**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read/write everything. Use only for testing!

---

## After Deploying Rules

Your app should now work! You can:
- ✅ Sign up as Student or Tutor
- ✅ Create profiles
- ✅ Use all features

---

## Troubleshooting

**Still getting permissions error?**
- Make sure rules are published (check Firebase Console → Firestore → Rules)
- Wait 1-2 minutes for rules to propagate
- Clear browser cache and refresh
- Check browser console for specific error messages

**Rules not saving?**
- Check for syntax errors (red highlighting in Firebase Console)
- Make sure you clicked "Publish"
- Check you're in the correct Firebase project
