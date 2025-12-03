# QuickFix - Service Marketplace Template

## Overview
QuickFix is a service marketplace platform connecting **Customers** with **Vendors** for home services, repairs, and maintenance. Built from the TutorLink template with a 3-role system.

---

## Role Mapping (TutorLink → QuickFix)

| TutorLink | QuickFix | Description |
|-----------|----------|-------------|
| Student | Customer | Person requesting services |
| Tutor | Vendor | Service provider (plumbers, electricians, etc.) |
| Admin | Admin | Platform administrator |

---

## Services Offered

Examples:
- 🔧 Plumbing (pipe repairs, installations)
- ⚡ Electrical work
- 🎨 Painting & decorating
- 🧹 Cleaning services
- 🛠️ Appliance repair
- 🏗️ Carpentry
- 🌿 Gardening & landscaping

---

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/pawansahu/Documents/Projects/MuteAds/QuickFix
npm install
```

### 2. Setup Environment
Copy `.env.local` and update:
```env
# Firebase (use new project)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# ... other Firebase config

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### 3. Run Development Server
```bash
npm run dev
```

---

## Key Customizations Needed

### 1. Branding & UI
- [ ] Update app name (TutorLink → QuickFix)
- [ ] Change color scheme in `tailwind.config.ts`
- [ ] Update logo and favicon
- [ ] Modify landing page content

### 2. Database Schema
- [ ] Rename `tutorProfile` → `vendorProfile`
- [ ] Rename `studentProfile` → `customerProfile`
- [ ] Update booking fields (session → service job)
- [ ] Add service categories

### 3. Features to Modify
- [ ] **Subjects** → **Service Categories**
- [ ] **Hourly Rate** → **Service Rate/Pricing**
- [ ] **Session Duration** → **Job Duration/Estimate**
- [ ] **Ratings** → **Service Reviews**
- [ ] **Verification** → **Vendor Background Check**

### 4. Services Specific Features
- [ ] Add service location/radius
- [ ] Emergency service flag
- [ ] Before/After photo uploads
- [ ] Multiple quote requests
- [ ] Job completion checklist

---

## File Structure

```
QuickFix/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── customer/     # Customer dashboard
│   │   │   ├── vendor/       # Vendor dashboard
│   │   │   ├── admin/        # Admin panel
│   │   │   └── ...
│   ├── components/           # Reusable UI components
│   ├── lib/
│   │   ├── firebase/         # Firebase config
│   │   ├── services/         # Business logic
│   │   └── types/            # TypeScript types
│   └── contexts/             # React contexts
├── public/                   # Static assets
└── ...
```

---

## Core Features (Already Built)

✅ **Authentication**
- Email/password login
- Role-based access (Customer, Vendor, Admin)
- Profile management

✅ **Search & Discovery**
- Find vendors by service, location, rating
- Filter and sort options
- Featured vendors

✅ **Booking System**
- Request service
- Vendor accepts/declines
- Status tracking

✅ **Payment Integration**
- Razorpay integration
- UPI, Cards, Netbanking
- Automatic confirmation

✅ **Communication**
- Real-time chat
- Push notifications (FCM)
- Email alerts (to add)

✅ **Rating & Reviews**
- Leave reviews after service
- Average rating calculation
- Public feedback

✅ **Admin Panel**
- Vendor verification
- User management
- Platform analytics

---

## Customization Roadmap

### Phase 1: Rebranding (1-2 days)
1. Update names & terminology
2. Change color scheme
3. Modify landing page
4. Update logo/branding

### Phase 2: Service-Specific Features (3-5 days)
1. Service categories system
2. Location-based search
3. Photo upload for jobs
4. Quote comparison

### Phase 3: Enhanced Booking (2-3 days)
1. Emergency service requests
2. Recurring services
3. Multi-vendor quotes
4. Job completion workflow

### Phase 4: Production (2-3 days)
1. Firebase security rules
2. Production deployment
3. SEO optimization
4. Performance tuning

---

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel
```

---

## Next Steps

1. **Create new Firebase project** for QuickFix
2. **Update .env.local** with new credentials
3. **Run `npm install`** to set up dependencies
4. **Start customizing** following the roadmap above

---

## Support

This template includes:
- Full authentication system
- Payment processing
- Real-time chat
- Booking management
- Admin dashboard
- Mobile-responsive UI

Use it as a foundation and customize for your service marketplace needs!

---

**Built from TutorLink Template** 🚀
