# Firebase Cloud Messaging Setup Guide

## Prerequisites

You must have already:
- ✅ Created a Firebase project
- ✅ Enabled Firebase Authentication
- ✅ Set up Firestore Database

---

## Step 1: Enable Cloud Messaging

### Firebase Console Setup

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select your project**
3. **Click on Project Settings** (gear icon)
4. **Go to "Cloud Messaging" tab**

### Generate Web Push Certificate (VAPID Key)

1. Scroll down to **"Web Push certificates"** section
2. Click **"Generate key pair"**
3. **Copy the Key pair** (starts with `B...`)
4. Save this for the next step

---

## Step 2: Update Environment Variables

Add to your `.env.local` file:

```env
# Existing Firebase config...
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NEW: Add VAPID key for push notifications
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

**Replace `YOUR_VAPID_KEY_HERE`** with the key you copied in Step 1.

---

## Step 3: Update Service Worker

Edit `/public/firebase-messaging-sw.js` and replace placeholder values:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",           // ← Replace
  authDomain: "YOUR_AUTH_DOMAIN",   // ← Replace
  projectId: "YOUR_PROJECT_ID",     // ← Replace
  storageBucket: "YOUR_STORAGE_BUCKET",  // ← Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // ← Replace
  appId: "YOUR_APP_ID"              // ← Replace
});
```

Use the **same values** from your `.env.local` file.

---

## Step 4: Register Service Worker

The service worker is already referenced in the code. Just restart your dev server:

```bash
npm run dev
```

---

## Step 5: Test Notifications

### Enable Notifications

1. **Log in** to your app
2. **Click the notification icon** (or prompt will appear)
3. **Allow notifications** when browser asks
4. **FCM token** will be saved to Firestore

### Test in Browser Console

Open browser DevTools (F12) → Console, and run:

```javascript
// Send a test notification
const messaging = firebase.messaging();
messaging.onMessage((payload) => {
  console.log('Message received:', payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192.png'
  });
});
```

---

## Step 6: Verify Firestore

Check your Firestore database:

1. Go to **Firestore Database** → `users` collection
2. Find your user document
3. Should see a new field:
   ```json
   {
     "fcmTokens": ["ABC123..."],
     "notificationSettings": {
       "enabled": true,
       "messages": true,
       "verifications": true,
       "subscriptions": true,
       "admin": true
     }
   }
   ```

---

## Step 7: Update Firestore Rules

Add to your `firestore.rules`:

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
  
  // Allow reading FCM tokens for admins and message senders
  allow read: if request.auth != null && (
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}
```

Deploy to Firebase:
```bash
firebase deploy --only firestore:rules
```

---

## Step 8: Testing Notifications

### Automatic Triggers (Already Implemented)

Notifications will automatically be sent when:

1. **New Message:**
   - Student sends message → Tutor gets notification
   - Tutor sends message → Student gets notification

2. **Verification:**
   - Tutor submits documents → Admin gets notification
   - Admin approves/rejects → Tutor gets notification

3. **Subscription:**
   - Admin grants subscription → Tutor gets notification
   - Admin disables subscription → Tutor gets notification
   - Subscription expiring (< 7 days) → Tutor gets notification

### Manual Test

To manually test, you can use Firebase Console:

1. Go to **Cloud Messaging** → **Send test message**
2. Enter FCM token (from Firestore user document)
3. Fill in notification title and body
4. Click **Test**

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support |
| Firefox | ✅ Full | Works well |
| Safari | ⚠️ Limited | Requires macOS 13+ |
| Edge | ✅ Full | Chromium-based |
| Mobile | ⚠️ Varies | PWA install required |

---

## Troubleshooting

### "Messaging is not initialized"
- Make sure you're using HTTPS (or localhost)
- Check that VAPID key is correctly set in `.env.local`
- Restart dev server after adding env variables

### "Permission denied"
- User must grant notification permission
- Re-request permission if previously denied
- Check browser notification settings

### Service worker not registering
- Make sure file is at `/public/firebase-messaging-sw.js`
- Check browser console for errors
- Try clearing cache and reloading

### Notifications not received in background
- Service worker must be registered
- Firebase config in SW must match your project
- Check browser's notification settings

### "Notification permission is default"
- User hasn't been prompted yet
- Call `NotificationService.enableNotifications(userId)`
- Show UI prompt to request permission

---

## Next Steps

Once setup is complete:

1. ✅ Users can enable/disable notifications
2. ✅ Notifications sent for all interactions
3. ✅ Works in foreground and background
4. ✅ Click notification to open relevant page

---

## Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**All set!** Your push notification system is ready to use! 🎉
