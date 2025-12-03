# Quick Test Guide - Subscription System

## Problem: "No tutors found" in Admin Subscriptions

This means there are no tutor accounts in your Firebase database yet.

---

## Solution: Create a Test Tutor Account

Follow these exact steps:

### Step 1: Sign Out from Admin
- Click "Sign Out" in the navbar
- Or go to `/en/auth/login`

### Step 2: Create Tutor Account
1. Go to: `http://localhost:3000/en/auth/signup`
2. Click the **"Tutor"** button (👨‍🏫)
3. Fill in the form:
   - First Name: Test
   - Last Name: Tutor
   - Email: `tutor@test.com`
   - Password: `test123456`
   - City: Dubai
   - Gender: Male
   - Area: Downtown
4. Click "Create Account"
5. You should be logged in as a tutor

### Step 3: Sign Out and Log Back as Admin
1. Click "Sign Out"
2. Go to: `http://localhost:3000/en/auth/login`
3. Log in with your admin credentials

### Step 4: Manage Subscription
1. Navigate to: `http://localhost:3000/en/admin/subscriptions`
2. **You should now see** "Test Tutor" in the list!
3. The tutor will have:
   - ❌ **Inactive** badge (red/gray)
   - Three buttons: **Monthly** | **Quarterly** | **Yearly**

### Step 5: Grant Subscription
1. Click **"Monthly"** button
2. Alert: "monthly subscription granted successfully!"
3. Refresh the page
4. The tutor should now have:
   - ✅ **Active** badge (green)
   - Shows: "Expires in: 30 days"
   - Buttons change to: **+ 30 Days** | **Disable**

---

## Testing Tutor Side

### As Tutor:
1. Log in as the tutor (`tutor@test.com`)
2. Go to: `/en/tutor/dashboard`
3. **Initially** (no subscription):
   - See yellow warning box: "⚠️ Subscription Required"
   - Click "Subscribe Now"
   - View `/en/tutor/subscription` - shows **Inactive**

4. **After Admin Grants Subscription**:
   - Go back to `/en/tutor/dashboard`
   - Yellow warning **disappears!**
   - You can now receive students

5. Check `/en/tutor/subscription`:
   - Shows **Active** status with green badge
   - Displays plan type (Monthly)
   - Shows expiry date and days remaining
   - View subscription history

---

## Common Issues

### Issue: Still shows "No tutors found"
**Solutions:**
1. Open browser console (F12)
2. Look for errors in the console
3. Check if Firebase rules are deployed
4. Verify the tutor account was actually created:
   - Go to Firebase Console
   - Check Firestore → `users` collection
   - Should see a document with `role: 'tutor'`

### Issue: "Permission denied" error
**Solution:** Deploy Firestore rules (see DEPLOY_RULES.md)

### Issue: Tutor exists but subscription buttons not working
**Solutions:**
1. Check browser console for errors
2. Verify Firebase credentials in `.env.local`
3. Make sure you're logged in as admin (not tutor)

---

## Verification Checklist

- [ ] Can create tutor account
- [ ] Admin can see tutor in subscriptions page
- [ ] Can grant monthly subscription
- [ ] Tutor status changes to "Active"
- [ ] Can click "+ 30 Days" to extend
- [ ] Can click "Disable" to deactivate
- [ ] Tutor sees warning when inactive
- [ ] Warning disappears when active
- [ ] Tutor can view subscription details

---

## Next Steps

Once you have at least one tutor with an active subscription:
- Test the search functionality
- Verify tutor appears in `/en/search`
- Test student can find and contact tutor
- Verify interested students tracking

---

## Need Help?

1. **Check Console**: Press F12 → Console tab
2. **Check Firestore**: Check users collection in Firebase Console
3. **Check Rules**: Make sure Firestore rules are deployed
4. **Error Messages**: The page now shows helpful error messages - read them!
