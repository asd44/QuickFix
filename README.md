# QuickFix - Home Services Marketplace

**QuickFix** is a comprehensive service marketplace platform connecting customers with verified home service providers across India. Get trusted electricians, plumbers, carpenters, and more — all at your doorstep with a fixed **Rs 99 visiting charge**.

![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)

---

## 🏠 Features

### For Customers
- 🔍 **Browse Service Providers** - Search by category, type, and location
- ⚡ **8 Service Categories** - Electrical, Plumbing, Carpentry, Cleaning, Painting, Appliance Repair, Pest Control, Home Maintenance
- 💰 **Fixed Visiting Charge** - Rs 99 for on-site inspection
- ⭐ **Ratings & Reviews** - See verified customer feedback
- 💬 **Direct Messaging** - Chat with service providers
- 📅 **Easy Booking** - Schedule inspections online
- 📱 **Real-time Updates** - Track booking status

### For Service Providers
- 📊 **Provider Dashboard** - Manage bookings and earnings
- ✓ **Verification System** - Get verified with document uploads
- 📈 **Lead Generation** - See interested customers
- 💳 **Subscription Plans** - Appear in search results
- 🔧 **Profile Management** - Showcase your expertise
- 💬 **Customer Communication** - Chat with potential customers

### For Admins
- 👑 **Admin Panel** - Manage users and verifications
- ✅ **Provider Verification** - Approve/reject service providers
- 📋 **Complaint Management** - Handle customer complaints
- 📊 **Analytics** - Track platform usage

---

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Payment:** Razorpay
- **UI Components:** Custom component library
- **State Management:** React Context API
- **Date Handling:** date-fns

---

## 📦 Getting Started

### Prerequisites
- **Node.js** 16+ installed
- **npm** or **yarn**
- **Firebase account**
- **Razorpay account** (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/quickfix.git
cd quickfix
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:
- Create a Firebase project
- Enable Authentication
- Set up Firestore Database
- Configure Cloud Storage
- Deploy security rules

4. **Configure environment variables**

Create `.env.local` in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

See [.env.example](./.env.example) for a template.

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
QuickFix/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── admin/             # Admin dashboard
│   │   ├── student/           # Customer pages
│   │   ├── tutor/             # Service provider pages
│   │   ├── search/            # Provider search page
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable React components
│   ├── contexts/              # React Context (Auth, etc.)
│   ├── lib/                   # Utilities and services
│   │   ├── firebase.ts        # Firebase initialization
│   │   ├── services/          # Business logic services
│   │   └── types/             # TypeScript types
│   └── styles/                # Global styles
├── public/                     # Static assets
├── FIREBASE_SETUP.md          # Firebase setup guide
├── SERVICE_CATEGORIES.md      # Service categories documentation
└── README.md                  # This file
```

---

## 🔧 Service Categories

QuickFix supports **8 service categories**:

| Icon | Category | Services |
|------|----------|----------|
| ⚡ | **Electrical** | Wiring, installations, repairs, switches |
| 🚰 | **Plumbing** | Pipe repairs, tap fixing, bathroom work |
| 🪚 | **Carpentry** | Furniture, doors, woodwork |
| 🧹 | **Cleaning** | Home, office, deep cleaning |
| 🎨 | **Painting** | Wall painting, touch-ups, textures |
| 🔌 | **Appliance Repair** | AC, fridge, washing machine |
| 🐜 | **Pest Control** | Termites, cockroaches, rodents |
| 🏠 | **Home Maintenance** | General repairs and upkeep |

Each category supports:
- **Installation** - New equipment/fixtures
- **Repair** - Fix existing issues
- **Maintenance** - Regular upkeep
- **Emergency Service** - Urgent 24/7 repairs

---

## 💰 Pricing Model

**Visiting Charge:** Rs 99 (Fixed)

This covers:
- ✓ On-site inspection of the issue
- ✓ Professional assessment and diagnosis
- ✓ Detailed quotation for required work
- ✓ Expert recommendations

> **Note:** Actual service charges are quoted on-site after inspection.

---

## 🔐 Authentication & Authorization

QuickFix uses Firebase Authentication with **3 user roles**:

| Role | Access |
|------|--------|
| **Customer** (`student`) | Browse providers, book services, rate providers |
| **Service Provider** (`tutor`) | Manage bookings, upload credentials, subscription |
| **Admin** (`admin`) | Verify providers, manage complaints, platform oversight |

---

## 🗄️ Database Structure

QuickFix uses Firebase Firestore with the following collections:

- **users** - Customer and provider profiles
- **bookings** - Service inspection bookings
- **chats** - Messaging between customers and providers
- **ratings** - Provider reviews and ratings
- **subscriptions** - Provider subscription records
- **interestedStudents** - Customer leads for providers

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed schema.

---

## 🛠️ Development

### Available Scripts

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Code Style

- **TypeScript** for type safety
- **ESLint** for code quality
- **Tailwind CSS** for styling
- **Prettier** for code formatting

---

## 📝 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md) - Complete Firebase configuration
- [Service Categories](./SERVICE_CATEGORIES.md) - All supported services

---

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📧 Contact

**QuickFix Team**
- Email: admin@quickfix.in
- Support: support@quickfix.in
- Website: https://quickfix.in

---

## 🙏 Acknowledgments

- Next.js team for an amazing framework
- Firebase for backend infrastructure
- Tailwind CSS for styling utilities
- All service providers making QuickFix possible!

---

**Made with ❤️ in India 🇮🇳**
