# Complete Subscription System - End-to-End Guide

## System Overview

The subscription system is **admin-controlled**, meaning admins grant, enable, disable, and manage all tutor subscriptions through the admin panel.

---

## User Flows

### 🎓 **Tutor Flow**

1. **Sign up as Tutor** at `/en/auth/signup`
   - Select "Tutor" role
   - Fill in profile details
   - Account created with **inactive subscription** by default

2. **Check Subscription Status**
   - Go to `/en/tutor/dashboard`
   - See yellow warning: "⚠️ Subscription Required"
   - Click "Subscribe Now" → redirects to `/en/tutor/subscription`

3. **View Subscription Page** (`/en/tutor/subscription`)
   - See current status: **Inactive**
   - View benefits of subscription
   - Contact admin instructions displayed
   - View subscription history (empty initially)

4. **Contact Admin**
   - Admin manually grants subscription via admin panel

5. **After Subscription Activated**
   - Return to `/en/tutor/dashboard`
   - Yellow warning disappears
   - Profile appears in search results
   - Can receive student messages
   - View interested students

---

### 👨‍💼 **Admin Flow**

1. **Access Admin Panel**
   - Create admin account at `/en/auth/create-admin` (secret key: `TUTORLINK_ADMIN_2024`)
   - Or log in as existing admin

2. **Manage Subscriptions** at `/en/admin/subscriptions`
   - See ALL tutors with their current status
   - For each tutor:
     - Name, email, subscription status
     - Days remaining (if active)
     - Action buttons

3. **Grant New Subscription** (for inactive tutors)
   - Click "Monthly" (30 days)
   - Click "Quarterly" (90 days)  
   - Click "Yearly" (365 days)
   - Subscription created immediately
   - Tutor status changes to **Active**

4. **Extend Active Subscription**
   - Click "+ 30 Days" to extend by 30 days
   - Extends current end date

5. **Disable Subscription**
   - Click "Disable"
   - Confirm popup
   - Tutor immediately removed from search
   - Status changes to **Inactive**

---

## Technical Implementation

### Database Structure

#### Subscriptions Collection
```typescript
{
  id: string;
  tutorId: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  amount: number; // 0 for admin-granted
  status: 'active' | 'expired';
  paymentMethod: 'admin_granted' | 'admin_enabled';
  startDate: Timestamp;
  endDate: Timestamp;
}
```

#### User Document (Tutor)
```typescript
{
  tutorProfile: {
    subscription: {
      plan: 'monthly' | 'quarterly' | 'yearly';
      status: 'active' | 'expired';
      startDate: Timestamp;
      endDate: Timestamp;
    }
  }
}
```

### Key Service Methods

**SubscriptionService:**
- `grantSubscription(tutorId, plan, durationDays?)` - Admin grants free subscription
- `enableSubscription(tutorId, extendDays)` - Reactivate or extend
- `disableSubscription(tutorId)` - Immediately disable
- `getTutorSubscriptions(tutorId)` - Get history
- `expireOldSubscriptions()` - Cron job to auto-expire

**AdminService:**
- `getAllUsers(role?)` - Get all users filtered by role

---

## Search Integration

Only tutors with **active subscriptions** appear in search results.

**TutorService searches** filter by:
```typescript
where('tutorProfile.subscription.status', '==', 'active')
```

---

## Features

✅ **Admin-controlled activation** - No payment integration needed
✅ **Flexible duration** - Custom days or predefined plans
✅ **Real-time updates** - Changes reflect immediately
✅ **Subscription history** - Track all past subscriptions
✅ **Expiry warnings** - Alert when < 7 days remaining
✅ **Auto-hide from search** - Expired tutors removed automatically
✅ **Locale-aware routing** - Works with EN/AR languages

---

## Routes

| Page | Path | Purpose |
|------|------|---------|
| Admin Subscriptions | `/en/admin/subscriptions` | Manage all tutor subscriptions |
| Tutor Subscription | `/en/tutor/subscription` | View own subscription status |
| Admin Dashboard | `/en/admin` | Overview with subscription link |
| Tutor Dashboard | `/en/tutor/dashboard` | Shows subscription warning if inactive |

---

## Testing Checklist

### As Admin:
- [ ] Navigate to `/en/admin/subscriptions`
- [ ] See list of all tutors
- [ ] Grant monthly subscription to a tutor
- [ ] Verify tutor status changes to "Active"
- [ ] Extend subscription by 30 days
- [ ] Disable subscription
- [ ] Verify tutor removed from search

### As Tutor:
- [ ] Sign up as new tutor
- [ ] Check `/en/tutor/dashboard` - see warning
- [ ] Click "Subscribe Now"
- [ ] View `/en/tutor/subscription` - see inactive status
- [ ] Ask admin to grant subscription
- [ ] Refresh dashboard - warning disappears
- [ ] Check `/en/search` - your profile appears

### Integration Test:
- [ ] Admin grants 1-day subscription
- [ ] Wait 1 day (or manually run `expireOldSubscriptions()`)
- [ ] Verify tutor automatically removed from search
- [ ] Admin re-enables subscription
- [ ] Tutor reappears in search

---

## Troubleshooting

**"No tutors showing in admin subscriptions"**
- Check Firebase rules are deployed
- Verify `AdminService.getAllUsers('tutor')` is working
- Check browser console for errors
- Ensure tutors exist in Firebase (sign up first)

**"Subscribe Now" button 404**
- Fixed! Now uses `Link` component with locale
- Should redirect to `/en/tutor/subscription`

**"Permission denied" errors**
- Deploy Firestore rules (see DEPLOY_RULES.md)
- Ensure admin has `role: 'admin'` in Firestore

**Subscription not updating in real-time**
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check Firestore to verify data was written
- Ensure AuthContext is providing latest `userData`

---

## Future Enhancements

- [ ] Stripe payment integration
- [ ] Automated billing
- [ ] Email notifications for expiry
- [ ] Subscription analytics dashboard
- [ ] Tiered subscription plans with different features
- [ ] Trial periods
- [ ] Promo codes / discounts

---

## Security Notes

- All subscription changes require admin role
- Firestore rules prevent tutors from self-activating
- Admin secret key should be changed in production
- Consider adding audit logging for subscription changes
