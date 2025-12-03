# Ngrok Setup for Local Webhook Testing

## Quick Start

### 1. Install ngrok (Running...)
```bash
npm install -g ngrok
```

### 2. Start Your Dev Server
```bash
npm run dev
```
Server runs on: `http://localhost:3000`

### 3. In NEW Terminal - Start ngrok
```bash
ngrok http 3000
```

### 4. Copy Public URL
You'll see output like:
```
Session Status: online
Forwarding: https://abc123-456.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL:** `https://abc123-456.ngrok-free.app`

### 5. Configure Razorpay Webhook

1. Go to Razorpay Dashboard
2. Settings → Webhooks
3. Click "+ Create New Webhook"
4. **Webhook URL:** `https://your-ngrok-url.ngrok-free.app/api/webhooks/razorpay`
5. **Active Events:**
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`
6. **Alert Email:** Your email
7. **Click Save**
8. **Copy Webhook Secret** → Add to `.env.local`

---

## .env.local Configuration

Add ngrok URL and webhook secret:

```env
# Razorpay API Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Webhook Secret (from Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# For local development with ngrok (optional)
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app
```

---

## Testing Webhooks Locally

### Terminal 1: Dev Server
```bash
npm run dev
```

### Terminal 2: ngrok
```bash
ngrok http 3000
```

### Terminal 3: Watch Logs (Optional)
```bash
npm run dev -- --turbo
```

---

## ngrok Tips

### Free Tier Limitations
- ⚠️ URL changes every time you restart ngrok
- ⚠️ Need to update Razorpay webhook URL each time
- ✅ Unlimited requests
- ✅ HTTPS included

### Pro Account (Optional)
- Fixed subdomain: `yourapp.ngrok.io`
- Custom domains
- No URL rotation
- **$8/month**

### Alternative: ngrok Authtoken (Free)
```bash
# Sign up at ngrok.com
# Get your authtoken from dashboard
ngrok config add-authtoken YOUR_TOKEN
```

Benefits:
- Longer session duration
- Web dashboard

---

## Webhook Endpoint Structure

Your webhook will be at:
```
https://your-ngrok-url.ngrok-free.app/api/webhooks/razorpay
```

We'll create this endpoint to:
1. Verify webhook signature
2. Check payment status
3. Update booking in Firestore
4. Send notification to tutor/student

---

## Troubleshooting

### ngrok Not Found
```bash
# macOS with Homebrew
brew install ngrok

# Or download from ngrok.com
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Use different port
npm run dev -- -p 3001
ngrok http 3001
```

### Webhook Not Receiving Events
- ✅ Check ngrok is running
- ✅ Check dev server is running
- ✅ Verify webhook URL in Razorpay
- ✅ Check event types are selected
- ✅ Test with Razorpay "Send Test Webhook"

---

## Next Steps

1. ✅ Install ngrok (running now)
2. Start dev server: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy ngrok URL
5. Add webhook in Razorpay Dashboard
6. Let me know when ready - I'll implement the webhook handler!

---

## Production Deployment

When deploying to production:
- ❌ Don't use ngrok
- ✅ Use your actual domain
- Update webhook URL to: `https://yourdomain.com/api/webhooks/razorpay`
- Razorpay will send events to production URL
