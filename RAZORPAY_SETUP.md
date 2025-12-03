# Razorpay Setup Guide

## Step 1: Create Razorpay Account (5 minutes)

### Sign Up
1. Go to https://razorpay.com/
2. Click **"Sign Up"**
3. Enter your details:
   - Business Email
   - Mobile Number
   - Password
4. Verify email and mobile

### Test Mode
- Account starts in **Test Mode** (free)
- No KYC needed for testing
- Use test payment methods

---

## Step 2: Get API Keys

### Access Keys
1. Log in to Razorpay Dashboard
2. Go to **Settings** (gear icon) → **API Keys**
3. Click **"Generate Test Key"**

### Copy Both Keys
- **Key ID**: `rzp_test_...` (Publishable)
- **Key Secret**: `...` (Secret, keep private)

### Add to .env.local
```env
# Razorpay API Keys (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

---

## Step 3: Test Payment Methods

Razorpay provides test credentials for testing:

### UPI Test
- Any UPI ID works in test mode
- Use: `success@razorpay` - Auto success
- Use: `failure@razorpay` - Auto failure

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4111 1111 1111 1234
- CVV: Any 3 digits
- Expiry: Any future date

### Test Netbanking
- Select any bank
- It will auto-succeed in test mode

---

## Step 4: Webhook Setup

### Create Webhook
1. Dashboard → **Settings** → **Webhooks**
2. Click **"+ Create New Webhook"**
3. Enter webhook URL: `https://your-domain.com/api/webhooks/razorpay`
4. Select events:
   - ✅ `payment.captured` (Payment successful)
   - ✅ `payment.failed` (Payment failed)
   - ✅ `qr_code.credited` (QR code payment received)
5. Set alert email
6. **Save**

### Webhook Secret
- Copy the **Webhook Secret**
- Add to `.env.local`:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Payment Flow

### QR Code Payment
```
1. Student books session → Booking created (pending)
2. System generates Razorpay QR code with amount
3. Student scans QR with GPay/Paytm/PhonePe
4. Student pays
5. Razorpay sends webhook → payment.captured
6. Webhook updates booking (confirmed, paid)
7. Success! ✅
```

### Standard Checkout (Optional)
```
1. Student clicks "Pay Now"
2. Razorpay checkout modal opens
3. Student chooses: UPI / Card / Netbanking / Wallet
4. Completes payment
5. Webhook confirms → Booking updated
```

---

## Features We'll Implement

### Phase 1: Basic Integration ✓
- [/] Install Razorpay SDK
- [ ] Initialize Razorpay client
- [ ] Create payment order API
- [ ] Payment success handler

### Phase 2: QR Code Payment
- [ ] Generate QR code for booking
- [ ] Display QR in modal
- [ ] Poll for payment status
- [ ] Auto-confirm on payment

### Phase 3: Webhook
- [ ] Create webhook endpoint
- [ ] Verify webhook signature
- [ ] Update booking on payment
- [ ] Send notifications

---

## Pricing (Live Mode)

**UPI Payments:**
- 2% fee (capped at ₹3)
- Example: ₹500 session → ₹10 fee

**Cards:**
- 2% fee
- Example: ₹500 session → ₹10 fee

**Netbanking:**
- ₹3 per transaction

**No monthly fees, no setup fees**

---

## Going Live

When ready for production:

### KYC Verification
1. Dashboard → **Account & Settings**
2. Submit documents:
   - PAN Card
   - Bank Account Details
   - Business Registration (if company)
   - Address Proof
3. Wait 24-48 hours for approval

### Switch to Live Mode
1. Generate **Live API Keys**
2. Update `.env.local` with live keys
3. Update webhook URL
4. Test with small amounts first

---

## Testing Checklist

- [ ] Create booking
- [ ] Generate QR code
- [ ] Scan with GPay (test mode)
- [ ] Payment succeeds
- [ ] Webhook receives event
- [ ] Booking status updates
- [ ] Student sees confirmation
- [ ] Tutor gets notification

---

## Security Best Practices

> [!IMPORTANT]
> - Never expose `RAZORPAY_KEY_SECRET` in frontend
> - Always verify webhook signatures
> - Use HTTPS in production
> - Validate payment amounts server-side
> - Log all payment attempts

---

## Support

**Razorpay Documentation:**
- https://razorpay.com/docs/
- https://razorpay.com/docs/payments/qr-codes/

**Test Credentials:**
- https://razorpay.com/docs/payments/payments/test-card-details/

**Support:**
- Email: support@razorpay.com
- Chat: Available in dashboard

---

## Next Steps

1. **Sign up** for Razorpay (5 min)
2. **Get test API keys** 
3. **Add to .env.local**
4. **Let me know** when ready - I'll implement the integration!
