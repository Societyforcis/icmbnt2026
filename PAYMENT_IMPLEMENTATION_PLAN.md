# Payment Registration System Implementation

## Overview
This document outlines the implementation of a payment registration system with Bank Transfer and PayPal options, including admin verification workflow.

## Components Created/Modified

### 1. Backend Models
- ✅ **PaymentRegistration.js** - New model for storing payment registrations
- ✅ **FinalAcceptance.js** - Added paymentStatus and paymentRegistrationId fields

### 2. Backend Routes (To be created)
- **POST /api/registration/submit** - Submit registration with payment proof
- **GET /api/registration/my-registration** - Get user's registration status
- **GET /api/admin/registrations/pending** - Get pending payment verifications
- **PUT /api/admin/registrations/:id/verify** - Verify payment
- **PUT /api/admin/registrations/:id/reject** - Reject payment

### 3. Frontend Components (To be modified)
- **Registrations.tsx** - Add payment method selection and upload

## Payment Flow

### User Flow:
1. User selects payment method (Bank Transfer or PayPal)
2. For Bank Transfer:
   - Display bank account details
   - User makes payment
   - User uploads payment screenshot
   - User enters transaction ID
   - User marks payment as "paid"
3. For PayPal:
   - Show "Coming Soon" message
4. Submit registration with payment proof
5. Wait for admin verification

### Admin Flow:
1. View pending payment registrations
2. See payment screenshot and transaction details
3. Verify or reject payment
4. Add verification notes
5. Update FinalAcceptance paymentStatus

## Database Schema

### PaymentRegistration
```javascript
{
  authorEmail: String,
  authorName: String,
  paperTitle: String,
  institution: String,
  address: String,
  country: String,
  paymentMethod: 'bank-transfer' | 'paypal' | 'qr-code',
  transactionId: String,
  amount: Number,
  paymentScreenshot: String (Base64),
  paymentStatus: 'pending' | 'verified' | 'rejected',
  verifiedBy: ObjectId,
  verifiedAt: Date,
  registrationCategory: String
}
```

### FinalAcceptance (New Fields)
```javascript
{
  paymentStatus: 'pending' | 'paid' | 'verified',
  paymentRegistrationId: ObjectId
}
```

## Next Steps
1. Create backend API routes
2. Update Registrations.tsx component
3. Create admin payment verification page
4. Test complete flow
