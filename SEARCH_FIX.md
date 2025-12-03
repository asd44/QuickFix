# Fixing Search to Show Active Tutors

## Issue Fixed

The search was not filtering by subscription status. Updated `TutorService` to only show tutors with **active subscriptions**.

---

## Changes Made

### 1. Updated `TutorService.searchTutors()`
Added filter:
```typescript
where('tutorProfile.subscription.status', '==', 'active')
```

### 2. Updated `TutorService.getFeaturedTutors()`
Added same filter for homepage featured tutors.

### 3. Created Firestore Indexes
File: `firestore.indexes.json` - Required for multi-field queries.

---

## Important: Create Firestore Index

Firebase will throw an error until you create the composite index.

### Method 1: Automatic (Easiest)

1. **Try to search** at `http://localhost:3000/en/search`
2. **Open browser console** (F12)
3. You'll see an error with a **link like:**
   ```
   https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
   ```
4. **Click the link** - it opens Firebase Console
5. **Click "Create Index"**
6. **Wait 2-5 minutes** for index to build
7. **Refresh the page** - tutors will appear!

### Method 2: Manual

1. Go to **Firebase Console** → Your Project
2. Click **Firestore Database** → **Indexes** tab
3. Click **"Create Index"**
4. Configure:
   - **Collection ID:** `users`
   - **Fields to index:**
     1. `role` - Ascending
     2. `tutorProfile.verified` - Ascending  
     3. `tutorProfile.subscription.status` - Ascending
     4. `tutorProfile.averageRating` - Descending
5. Click **"Create"**
6. Wait for build to complete (shows green checkmark)

### Method 3: Firebase CLI (If installed)

```bash
firebase deploy --only firestore:indexes
```

---

## Testing

Once the index is created:

1. **Navigate to:** `http://localhost:3000/en/search`
2. **You should see:** All tutors with **active subscriptions**
3. **Apply filters:** Subject, grade, price range
4. **Only shows tutors:**
   - ✅ Role = tutor
   - ✅ Verified = true
   - ✅ Subscription status = active

### As Student:
- Log in as student
- Go to `/en/search`
- See active tutors
- Click "View Profile"
- Send messages

### As Tutor (Inactive Subscription):
- Your profile **won't appear** in search
- Students can't find you
- Need admin to activate subscription

---

## Verification Steps

- [ ] Create index in Firebase Console
- [ ] Wait for index to build (green checkmark)
- [ ] Refresh search page
- [ ] See tutors with active subscriptions
- [ ] Tutors without subscriptions don't appear
- [ ] Disable a subscription in admin panel
- [ ] Verify tutor disappears from search immediately
- [ ] Re-enable subscription
- [ ] Tutor reappears in search

---

## Common Errors

**Error: "The query requires an index"**
- **Solution:** Create the composite index (see methods above)
- Click the link in the error message

**"No tutors found" but subscriptions are active**
- Check the index is built (Firebase Console → Indexes)
- Verify tutor has:
  - `verified: true`
  - `subscription.status: 'active'`
- Check browser console for errors

**Index taking too long**
- Small databases: 1-2 minutes
- Large databases: 5-10 minutes
- Check Firebase Console for progress

---

## How It Works

**Search Flow:**

1. Student visits `/en/search`
2. `TutorService.searchTutors()` queries Firestore
3. Firestore filters:
   - `role == 'tutor'`
   - `verified == true`
   - `subscription.status == 'active'` ⭐ **NEW**
4. Results sorted by rating
5. Client-side price filtering
6. Display to student

**Subscription Integration:**

- Admin grants subscription → `status = 'active'`
- Tutor appears in search **immediately**
- Admin disables subscription → `status = 'expired'`
- Tutor disappears from search **immediately**
- No cron job needed - real-time!

---

## Files Changed

- ✅ `src/lib/services/tutor.service.ts` - Added subscription filter
- ✅ `firestore.indexes.json` - Created composite index config

---

**Now search will only show tutors with active subscriptions!** 🎉
