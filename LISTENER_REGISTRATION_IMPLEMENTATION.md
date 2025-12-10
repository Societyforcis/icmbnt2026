# Listener Registration & Country-Based Pricing Implementation

## Overview
This implementation allows normal users (listeners/attendees) to register for the conference without submitting a paper. The system now supports country-based pricing with SCIS membership discounts and highlights the user's country in the fee table.

## Backend Changes

### 1. User Model Updates (`models/User.js`)
- **Added `country` field**: Stores user's country selection ('India', 'Indonesia', 'Other')
- Used for determining appropriate registration fees

### 2. New Listener Registration Model (`models/ListenerRegistration.js`)
- **Purpose**: Dedicated collection for listener/attendee registrations
- **Features**:
  - Stores listener registration details without requiring a paper
  - Supports payment verification workflow
  - Tracks SCIS membership status for discounts
  - Auto-generates unique registration numbers (format: `ICMBNT2026-LISTENER-XXXX`)
  - Supports certificate generation
  - Payment status tracking (pending/verified/rejected)

**Key Fields**:
- `userId`, `email`, `name`
- `institution`, `address`, `country`
- `paymentMethod`, `transactionId`, `amount`, `currency`, `paymentScreenshot`
- `registrationCategory` (indian-listener, foreign-listener, indonesian-listener)
- `isScisMember`, `scisMembershipId`
- `paymentStatus`, verification details
- `registrationNumber`, `certificateNumber`

### 3. Auth Controller Updates (`controllers/authController.js`)
- **Modified `login` response**: Now includes `country` field
- **New `updateUserCountry` endpoint**: Allows users to update their country selection
  - Validates country against allowed values
  - Returns updated user object

### 4. Auth Routes Updates (`routes/authRoutes.js`)
- **New route**: `PUT /api/auth/update-country` (protected)
  - Requires JWT authentication
  - Updates user's country preference

## Registration Fee Structure

### Indian Participants
| Category | SCIS Member | Non-SCIS Member |
|----------|-------------|-----------------|
| Students | ₹4,500 (50 USD) | ₹5,850 (65 USD) |
| Faculty/Research Scholars | ₹6,750 (75 USD) | ₹7,500 (85 USD) |
| Listeners | ₹2,500 | ₹3,500 |

### Foreign Participants
| Category | SCIS Member | Non-SCIS Member |
|----------|-------------|-----------------|
| Authors | $300 | $350 |
| Listeners | $100 | $150 |

### Indonesian Participants
| Category | SCIS Member | Non-SCIS Member |
|----------|-------------|-----------------|
| Authors | 17,00,000 IDR | 26,00,000 IDR |
| Listeners | 12,00,000 IDR | 15,00,000 IDR |

## Frontend Implementation Plan

### 1. Country Selection Component
- **Location**: Login page or profile settings
- **Features**:
  - Dropdown with options: India, Indonesia, Other
  - Saves to user profile via `/api/auth/update-country`
  - Persists in localStorage for quick access

### 2. Updated Registration Pages
The following components need updates:

#### `Registrations.tsx`
- Display country-specific pricing in fee table
- Highlight user's country row with gradient background
- Show SCIS membership discount banner
- Fetch user's country from localStorage or API

#### `SimplifiedRegistrationForm.tsx`
- Show dynamic pricing based on user's country and SCIS membership
- Display appropriate registration categories
- Calculate correct amount based on selection

#### `UniversalRegistrationForm.tsx`
- Support both author and listener registration
- Show country-specific categories
- Apply SCIS membership discounts automatically

### 3. Fee Table Enhancements
- **Highlighted Row**: User's country row gets gradient background
- **Color Scheme**: 
  - India: Blue gradient
  - Indonesia: Green gradient
  - Other/Foreign: Purple gradient
- **SCIS Discount Indicator**: Show savings amount when applicable

### 4. Listener Registration Flow
1. User logs in (without submitted paper)
2. System detects no paper submission
3. Shows listener registration option
4. User selects country (if not already set)
5. System displays country-specific listener fees
6. User selects category and payment method
7. Submits registration to `ListenerRegistration` collection
8. Admin verifies payment
9. User receives confirmation and certificate

## API Endpoints

### New/Updated Endpoints
- `PUT /api/auth/update-country` - Update user's country
- `POST /api/registration/submit-listener` - Submit listener registration (to be created)
- `GET /api/registration/my-listener-registration` - Get user's listener registration (to be created)

### Existing Endpoints (to be updated)
- `POST /api/registration/submit` - Handle both author and listener registrations
- `GET /api/registration/my-registration` - Return appropriate registration type

## Payment Methods Supported
1. **Bank Transfer** (UPI or Bank Account)
   - UPI: QR code payment
   - Bank Account: Direct transfer with bank details
2. **PayPal** - For international payments
3. **External Portal** - Melange Publications payment gateway

## Admin Verification Workflow
1. Admin receives listener registration
2. Reviews payment screenshot and transaction details
3. Verifies payment
4. Updates `paymentStatus` to 'verified' or 'rejected'
5. System sends email notification to user
6. Generates registration number and certificate

## Next Steps for Full Implementation
1. ✅ Backend models and routes created
2. ⏳ Create listener registration routes and controllers
3. ⏳ Update frontend components with country selection
4. ⏳ Implement dynamic pricing display
5. ⏳ Add row highlighting in fee tables
6. ⏳ Create admin panel for listener registration verification
7. ⏳ Update email templates for listener confirmations

## Testing Checklist
- [ ] User can select and update country
- [ ] Country persists across sessions
- [ ] Correct fees displayed based on country
- [ ] SCIS membership discount applied correctly
- [ ] Listener can register without paper
- [ ] Payment verification works for listeners
- [ ] Registration numbers generated correctly
- [ ] Email notifications sent properly
- [ ] Admin can verify listener payments
- [ ] Certificates generated for listeners

## Database Collections
1. **users** - Stores user accounts with country field
2. **listenerregistrations** - New collection for listener registrations
3. **paymentdonefinalusers** - Existing collection for author registrations
4. **memberships** - SCIS membership data (existing)

## Security Considerations
- Country selection requires authentication
- Payment screenshots stored securely (base64 encoded)
- Admin verification required before registration confirmation
- JWT tokens used for all protected routes
