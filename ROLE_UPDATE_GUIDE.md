# QuickFix Role Terminology Update Guide

## Role Mapping

| Old (TutorLink) | New (QuickFix) |
|-----------------|----------------|
| student         | customer       |
| tutor           | vendor         |
| admin           | admin (no change) |

## Database Field Mapping

| Old Field | New Field | Location |
|-----------|-----------|----------|
| `studentProfile` | `customerProfile` | User document |
| `tutorProfile` | `vendorProfile` | User document |
| `studentId` | `customerId` | Bookings, chats, etc. |
| `tutorId` | `vendorId` | Bookings, chats, etc. |
| `studentName` | `customerName` | Bookings |
| `tutorName` | `vendorName` | Bookings |

## Files That Need Updates

### Core Configuration
- [x] `/package.json` - Project name updated to "quickfix"
- [x] `/src/app/globals.css` - Color scheme updated to orange/amber
- [x] `/src/components/Navbar.tsx` - Brand name updated to "QuickFix"
- [x] `/src/components/RazorpayPayment.tsx` - Payment name updated

### Role-Based Files (To Update)
- [ ] `/src/types/database.ts` - Update interfaces
- [ ] `/src/contexts/AuthContext.tsx` - Role checks
- [ ] `/src/components/Navbar.tsx` - Role-based navigation
- [ ] `/src/app/[locale]/auth/signup/page.tsx` - Role selection
- [ ] `/src/app/[locale]/student/*` → Rename to `/customer/*`
- [ ] `/src/app/[locale]/tutor/*` → Rename to `/vendor/*`
- [ ] All services (booking, chat, user, etc.)

## UI Text Updates

### Navigation & Pages
| Old Text | New Text |
|----------|----------|
| "Join TutorLink" | "Join QuickFix" |
| "Find Tutors" | "Find Vendors" |
| "Become a Tutor" | "Become a Vendor" |
| "Student Dashboard" | "Customer Dashboard" |
| "Tutor Dashboard" | "Vendor Dashboard" |
| "My Tutors" | "My Vendors" |
| "Tutoring Session" | "Service Job" |
| "Session Duration" | "Job Duration" |
| "Hourly Rate" | "Service Rate" |

## Implementation Strategy

### Phase 1: Type & Database Changes (CRITICAL)
1. Update `database.ts` interfaces
2. Create migration guide for existing data
3. Update Firestore rules with new field names

### Phase 2: Rename Directories
```bash
# Student → Customer
mv src/app/[locale]/student src/app/[locale]/customer

# Tutor → Vendor  
mv src/app/[locale]/tutor src/app/[locale]/vendor
```

### Phase 3: Update Role Strings
- Find/replace all `'student'` → `'customer'`
- Find/replace all `'tutor'` → `'vendor'`
- Update role types in TypeScript

### Phase 4: Update UI Text
- Navbar labels
- Page titles
- Button text
- Form labels

### Phase 5: Service Layer
- Update all service methods
- Update parameter names
- Update return types

## Notes

⚠️ **Breaking Changes**: This will require database migration for existing users.

✅ **Backward Compatibility**: Consider adding migration logic to handle old role values.

🔄 **Testing Required**: Test all role-based features after changes.

---

**Status**: Branding and colors complete. Role terminology updates in progress.
