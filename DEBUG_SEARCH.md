# Debugging "No Tutors in Search"

## Quick Checklist

Run through these steps to diagnose the issue:

### 1. ✅ Check Browser Console

1. Go to `http://localhost:3000/en/search`
2. Press **F12** to open browser console
3. Look for logs:
   - `🔍 Searching with filters:`
   - `✅ Search results: X`
   - Any red errors?

### 2. ✅ Verify Tutor Data in Firestore

Go to **Firebase Console** → **Firestore Database** → `users` collection → Find your tutor

**The tutor document MUST have ALL these fields:**

```json
{
  "uid": "...",
  "email": "tutor@test.com",
  "role": "tutor",
  "tutorProfile": {
    "firstName": "Test",
    "lastName": "Tutor",
    "verified": true,  // ← MUST be true
    "subscription": {
      "status": "active",  // ← MUST be "active"
      "plan": "monthly",
      "startDate": { ... },
      "endDate": { ... }
    },
    "averageRating": 0,
    "subjects": [...],
    "hourlyRate": 50
  }
}
```

### 3. ✅ Common Issues

**Issue: verified = false**
- Admin must approve tutor first
- Or manually set `verified: true` in Firestore

**Issue: subscription missing**
- Admin must grant subscription
- Or manually add subscription object in Firestore

**Issue: subscription.status != "active"**
- Check exact spelling: `"active"` not `"Active"`
- Admin panel should set this correctly

---

## Quick Fix: Manually Set Fields

If you just want to test, manually edit the tutor in Firestore:

1. Go to Firestore → `users` → your tutor document
2. Click **Edit**
3. Ensure these exact values:
   ```
   role: "tutor"
   tutorProfile.verified: true
   tutorProfile.subscription.status: "active"
   tutorProfile.subscription.plan: "monthly"
   tutorProfile.averageRating: 0 (or any number)
   ```
4. Click **Save**
5. Refresh search page

---

## Alternative: Remove Verified Filter

If you want to test without verification, temporarily edit:

**File:** `src/lib/services/tutor.service.ts`

**Change:**
```typescript
// Line 14 - Comment out verified filter
const constraints: any[] = [
  where('role', '==', 'tutor'),
  // where('tutorProfile.verified', '==', true),  // ← Comment this out
  where('tutorProfile.subscription.status', '==', 'active'),
];
```

Save and refresh - now unverified tutors will show.

---

## Test Query Manually

Open browser console on search page and run:

```javascript
// Test if tutor exists
const db = firebase.firestore();
db.collection('users')
  .where('role', '==', 'tutor')
  .get()
  .then(snap => {
    console.log('All tutors:', snap.size);
    snap.forEach(doc => console.log(doc.data()));
  });

// Test with filters
db.collection('users')
  .where('role', '==', 'tutor')
  .where('tutorProfile.verified', '==', true)
  .where('tutorProfile.subscription.status', '==', 'active')
  .get()
  .then(snap => {
    console.log('Filtered tutors:', snap.size);
    snap.forEach(doc => console.log(doc.data()));
  });
```

---

## Expected Console Output

When search works correctly:

```
🔍 Searching with filters: {}
✅ Search results: 1 [{...tutorProfile...}]
```

When no tutors found:

```
🔍 Searching with filters: {}
✅ Search results: 0 []
```

---

## Most Likely Issue

Based on common patterns, the issue is usually:

1. **Tutor not verified** (`verified: false` or missing)
   - **Fix:** Admin approves at `/en/admin`
   - Or manually set in Firestore

2. **Subscription not properly set**
   - **Fix:** Admin grants at `/en/admin/subscriptions`
   - Or manually add subscription object

3. **Data structure mismatch**
   - **Fix:** Ensure nested field paths match exactly
   - `tutorProfile.subscription.status` not `subscription.status`

---

## Next Steps

1. Check browser console logs
2. Verify tutor data in Firestore
3. Fix missing/incorrect fields
4. Refresh search page
5. Should work!

If still not working, share:
- Console logs (screenshot)
- Tutor document structure (screenshot from Firestore)
