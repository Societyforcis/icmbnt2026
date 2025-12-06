# How to Use the Simplified Registration Form

## Step 1: Import the Component

At the top of `/srm-front2/src/components/Registrations.tsx` (around line 20), add:

```typescript
import SimplifiedRegistrationForm from './SimplifiedRegistrationForm';
```

## Step 2: Replace the Form Section

Find the line that says `{activeTab === 'form' && (` (around line 511)

Replace the entire form section (from line 511 to approximately line 850) with:

```tsx
{activeTab === 'form' && (
  <SimplifiedRegistrationForm />
)}
```

That's it! The new form will:

✅ Auto-fetch author name, email, paper title from accepted paper
✅ Show only payment options (no manual form filling)
✅ Bank Transfer → Choose UPI (shows QR code) or Bank Account (shows details)
✅ PayPal → Shows "Coming Soon"
✅ Upload transaction ID + screenshot
✅ Submit to backend API

## What the New Form Does:

1. **Fetches Paper Details** - Automatically gets user's accepted paper info
2. **Shows Paper Info** - Displays submission ID, author name, email, paper title
3. **Registration Category** - Indian Author (₹3,500) or Foreign Author ($150)
4. **Payment Method** - Bank Transfer or PayPal (coming soon)
5. **Bank Transfer Options**:
   - **UPI** - Shows QR code to scan
   - **Bank Account** - Shows account details
6. **Upload** - Transaction ID + Payment Screenshot
7. **Submit** - Sends to backend for admin verification

## Backend is Ready:

- ✅ `/api/registration/my-paper-details` - Fetches paper info
- ✅ `/api/registration/submit` - Submits payment registration
- ✅ Admin can verify payments
- ✅ Verified users go to `PaymentDoneFinalUser` collection

---

**The simplified form is complete and ready to use!**
