# Debugging Bookings Not Showing

## Issue
Bookings are not appearing in the tutor bookings page.

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab

Look for these logs:
- `Loading bookings for tutor: [userId]`
- `Executing Firestore query...`
- `Query returned X documents`
- `Booking document: [id] [data]`

### 2. Check Firestore Database

Go to Firebase Console → Firestore Database → `bookings` collection

**Verify:**
- Collection exists
- Documents have correct `tutorId` field
- `tutorId` matches your logged-in tutor's UID

### 3. Common Issues

#### Issue 1: No bookings created yet
**Solution:** Create a test booking first
- Log in as student
- Go to tutor profile
- Click "Book Session"
- Select date, time, duration
- Submit booking

#### Issue 2: Firestore index missing
**Error in console:** "The query requires an index"

**Solution:**
```bash
cd /Users/pawansahu/Documents/Projects/MuteAds/tutorlink
firebase deploy --only firestore:indexes
```

#### Issue 3: Wrong tutorId
**Check:** The `tutorId` in booking document should match the logged-in tutor's UID

**Fix:** Re-create booking with correct tutor

#### Issue 4: Date field type mismatch
**Check:** Make sure `date` field is a Firestore Timestamp, not a string

### 4. Manual Test

**Create a test booking manually:**

1. Go to Firestore Console
2. Create document in `bookings` collection:
```json
{
  "studentId": "student-uid-here",
  "tutorId": "YOUR-TUTOR-UID-HERE",
  "date": [Timestamp] "December 1, 2024 at 2:00:00 PM",
  "startTime": "14:00",
  "endTime": "15:00",
  "duration": 60,
  "hourlyRate": 50,
  "totalPrice": 50,
  "status": "pending",
  "paymentStatus": "unpaid",
  "notes": "Test booking",
  "studentName": "Test Student",
  "tutorName": "Test Tutor",
  "createdAt": [Timestamp] [current time],
  "updatedAt": [Timestamp] [current time]
}
```

3. Refresh tutor bookings page
4. Should now see the booking

---

## Quick Fix Commands

### Check if booking was created:
```javascript
// In browser console (F12)
const db = firebase.firestore();
db.collection('bookings').get().then(snapshot => {
  console.log('Total bookings:', snapshot.docs.length);
  snapshot.docs.forEach(doc => console.log(doc.id, doc.data()));
});
```

### Get current user UID:
```javascript
// In browser console
firebase.auth().currentUser.uid
```

Compare this with the `tutorId` in the booking document.

---

## Next Steps

1. Open browser console (F12)
2. Go to `/tutor/bookings`
3. Check what logs appear
4. Let me know what you see and I'll help debug further!
