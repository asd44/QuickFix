# Admin Account Setup for QuickFix

This guide explains how to create an admin account for QuickFix service marketplace.

---

## Why You Need an Admin Account

As an admin, you can:
- ✅ **Verify service providers** - Approve/reject verification requests
- 📊 **View all users** - See customers and providers
- 📋 **Manage complaints** - Handle customer issues
- 🔧 **Manage subscriptions** - Activate provider subscriptions
- 📈 **Access analytics** - View platform statistics

---

## Method 1: Create Admin via Firebase Console (Recommended)

This is the easiest method for creating your first admin account.

### Step 1: Create User Account

1. **Sign up normally** through the QuickFix app:
   - Go to `http://localhost:3000/auth/signup`
   - Choose **"I'm a Customer"** (role doesn't matter, we'll change it)
   - Fill in the form:
     - Email: `admin@quickfix.in` (or your preferred admin email)
     - Password: Create a strong password
     - First Name: `Admin`
     - Last Name: `User`
     - City: Any city
   - Click **"Sign Up"**

2. **Verify your email** (check inbox/spam)

### Step 2: Update User Role in Firestore

1. **Go to Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)

2. **Select your project**: `quickfix-services` (or whatever you named it)

3. **Navigate to Firestore Database**:
   - Click on **"Firestore Database"** in the left sidebar
   - You should see a `users` collection

4. **Find your user document**:
   - Click on the `users` collection
   - Find the document with your email (`admin@quickfix.in`)
   - Click on the document ID to open it

5. **Edit the user document**:
   - Find the `role` field (currently set to `"student"`)
   - Click on `"student"` to edit it
   - Change it to: `"admin"` (without quotes in the editor)
   - Click the **checkmark ✓** to save

6. **Remove unnecessary profile data** (optional but recommended):
   - Delete the `studentProfile` field (click the field name → Delete)
   - The document should now only have:
     ```
     uid: "user-id-here"
     email: "admin@quickfix.in"
     role: "admin"
     createdAt: [timestamp]
     ```

### Step 3: Test Admin Access

1. **Sign out** of QuickFix if you're logged in

2. **Sign in** with your admin credentials:
   - Go to `http://localhost:3000/auth/login`
   - Email: `admin@quickfix.in`
   - Password: Your admin password

3. **Access admin panel**:
   - Go to `http://localhost:3000/admin`
   - You should see the admin dashboard with:
     - Pending verifications
     - Complaint management
     - User statistics

✅ **You now have admin access!**

---

## Method 2: Create Admin via Direct Firestore Insert

If you haven't created an account yet, you can create an admin directly in Firestore.

### Step 1: Create Authentication User

1. **Go to Firebase Console** → **Authentication**
2. Click **"Add user"**
3. Enter:
   - Email: `admin@quickfix.in`
   - Password: Create a strong password
4. Click **"Add user"**
5. **Copy the User UID** (you'll need this in Step 2)

### Step 2: Create Firestore Document

1. **Go to Firestore Database**
2. Click **"Start collection"** (if `users` doesn't exist) or click `users` collection
3. Click **"Add document"**
4. Set **Document ID** to the User UID you copied
5. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | [The UID you copied] |
| `email` | string | `admin@quickfix.in` |
| `role` | string | `admin` |
| `createdAt` | timestamp | [Click "Insert timestamp"] |

6. Click **"Save"**

### Step 3: Sign In

- Go to `http://localhost:3000/auth/login`
- Sign in with `admin@quickfix.in` and your password
- Navigate to `http://localhost:3000/admin`

---

## Creating Multiple Admins

You can create multiple admin accounts by repeating either method above. Recommended admin accounts:

| Purpose | Email | Role |
|---------|-------|------|
| Super Admin | `admin@quickfix.in` | Main administrator |
| Support Admin | `support@quickfix.in` | Customer support |
| Verifications | `verify@quickfix.in` | Provider verification |

---

## Admin Dashboard Features

Once logged in as admin, you can access:

### `/admin` - Main Dashboard
- View pending provider verifications
- See recent complaints
- User statistics (total customers, providers)

### Provider Verification
- Review verification documents uploaded by service providers
- **Approve** - Mark provider as verified, makes them searchable
- **Reject** - Send rejection reason, provider can re-upload documents

### Complaint Management
- View all customer complaints
- Mark complaints as resolved
- Track complaint status

---

## Security Best Practices

> [!WARNING]
> **Admin accounts have full access to your platform!**

1. **Use strong passwords** - At least 12 characters with mix of letters, numbers, symbols
2. **Enable 2FA** - Set up two-factor authentication in Firebase Console
3. **Limit admin accounts** - Only create admin access for trusted team members
4. **Use separate emails** - Don't use personal emails for admin accounts
5. **Monitor admin activity** - Check Firestore audit logs regularly
6. **Rotate passwords** - Change admin passwords every 90 days

---

## Troubleshooting

### "Access Denied" when visiting `/admin`

**Problem:** User is not recognized as admin

**Solution:**
1. Check Firestore → `users` → your document
2. Verify `role` field is exactly `"admin"` (case-sensitive)
3. Sign out and sign back in

### Can't find user in Firestore

**Problem:** User document wasn't created during signup

**Solution:**
1. Check **Authentication** → Users to confirm account exists
2. Get the UID
3. Manually create document in Firestore (see Method 2)

### Admin panel shows "Loading..." forever

**Problem:** Firestore security rules not deployed

**Solution:**
1. Deploy security rules from `FIREBASE_SETUP.md`
2. Go to **Firestore Database** → **Rules**
3. Copy rules from documentation
4. Click **"Publish"**

---

## Testing Admin Functions

After creating your admin account, test these features:

- [ ] View pending verifications
- [ ] Approve a service provider
- [ ] Reject a service provider with reason
- [ ] View user statistics
- [ ] Access complaint management
- [ ] View all customers
- [ ] View all providers

---

## Production Deployment

For production, consider:

1. **Custom domain email**: Use `admin@yourdomain.com`
2. **Firebase Admin SDK**: For automated admin operations
3. **Audit logging**: Track all admin actions
4. **Role-based permissions**: Create sub-admin roles if needed
5. **Backup admin access**: Create at least 2 admin accounts

---

## Quick Reference

```bash
# Admin Login URL
http://localhost:3000/auth/login

# Admin Dashboard URL
http://localhost:3000/admin

# Default Admin Credentials (after setup)
Email: admin@quickfix.in
Password: [Your secure password]
```

---

## Need Help?

If you encounter issues:
1. Check **Firebase Console** → **Firestore Database** rules are published
2. Verify user document has `role: "admin"`
3. Clear browser cache and try again
4. Check browser console for errors

**Support:** admin@quickfix.in

---

**Last Updated:** December 2025
