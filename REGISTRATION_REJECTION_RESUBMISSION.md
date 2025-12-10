# Registration Rejection & Resubmission Flow

## Overview
When a registration is rejected by admin due to payment verification failure, users now have the ability to review the rejection reason and resubmit their registration with a different payment method.

---

## Rejection Scenarios

### **When Does Registration Get Rejected?**

1. **Invalid Payment Screenshot**
   - Image is unclear or unreadable
   - Doesn't show actual payment confirmation
   - Amount doesn't match registration amount

2. **Transaction ID Mismatch**
   - Transaction ID doesn't exist in payment system
   - Transaction ID doesn't match payment method
   - Amount from transaction doesn't match

3. **Payment Issues**
   - Payment appears to be fraudulent
   - Payment was reversed or cancelled
   - Duplicate payment detected

4. **Documentation Issues**
   - Screenshot is from wrong payment portal
   - Missing or incomplete information
   - Fraudulent documentation

---

## User Flow: Rejection & Resubmission

### **Step 1: Registration Rejected Message**
User sees rejection status with:
- ❌ **Status:** "Registration Rejected"
- **Reason for Rejection:** Specific details (e.g., "Invalid transaction ID")
- **Previous Details:**
  - Name, Paper, Amount, Previous Payment Method
  - Submission and Review dates
- **Helpful Tip:** "Try using a different payment method or ensure your payment details are correct"

### **Step 2: Resubmit Option**
User clicks **"🔄 Resubmit Registration"** button to:
- Clear all form fields
- Reset payment method selection
- Start fresh registration process
- Keep same registration type (author/listener)

### **Step 3: New Submission**
User can now:
- **Try Same Payment Method Again** with better documentation
  - Higher quality screenshot
  - More accurate transaction ID
  - Correct amount details
  
- **Switch to Different Payment Method**
  - If Bank Transfer failed → Try PayPal
  - If PayPal failed → Try Melange Portal
  - If Melange failed → Try Bank Transfer

- **Use Same Category** or change if needed

---

## Technical Implementation

### **Registration Status Display Logic**

**Pending/Verified Status:**
```tsx
if (registrationStatus && registrationStatus.paymentStatus !== 'rejected') {
    // Show normal status with summary
    // No resubmit option
}
```

**Rejected Status:**
```tsx
if (registrationStatus && registrationStatus.paymentStatus === 'rejected') {
    // Show detailed rejection info
    // Show "Resubmit Registration" button
    // Allow clearing form and trying again
}
```

### **Resubmit Button Handler**

```tsx
onClick={() => {
    setRegistrationStatus(null);           // Clear status
    setPaymentMethod('');                  // Reset payment
    setPaymentSubMethod('');               // Reset UPI/Bank
    setTransactionId('');                  // Clear transaction ID
    setPaymentScreenshot('');              // Clear screenshot
    setSelectedCategory('');               // Reset category
    setAmount(0);                          // Reset amount
}}
```

### **Form Availability After Resubmit**

When resubmit is clicked:
1. Registration status disappears
2. Full registration form becomes visible again
3. All previous form entries cleared
4. User can select any category again
5. User can choose any payment method

---

## User Experience Details

### **Rejection Screen Components**

```
┌─────────────────────────────────────────────┐
│         Registration Status                 │
├─────────────────────────────────────────────┤
│ ❌ Registration Rejected                    │
│ Your payment could not be verified...       │
├─────────────────────────────────────────────┤
│ Name: Ramji B                               │
│ Paper: AI Innovation                        │
│ Amount: 4500 INR                            │
│ Previous Method: paypal                     │
│ Registration Type: Author                   │
│ Submitted: 10/12/2025                       │
│ Reviewed: 10/12/2025                        │
│ Reason: Invalid transaction ID              │
├─────────────────────────────────────────────┤
│ 💡 Tip: Try different payment method        │
├─────────────────────────────────────────────┤
│  [🔄 Resubmit Registration]                │
│  Clear form and try again                  │
└─────────────────────────────────────────────┘
```

### **Information Preserved**

When user resubmits, the system remembers:
- ✅ User's registration type (author/listener)
- ✅ Paper details (for authors)
- ✅ Country selection
- ✅ User information

What resets:
- ❌ Payment method selection
- ❌ Transaction ID
- ❌ Payment screenshot
- ❌ Registration category choice
- ❌ Amount

---

## Best Practices for Users

### **To Avoid Rejection:**

1. **For Bank Transfer (UPI)**
   - Ensure QR code scan was successful
   - Get complete transaction ID from UPI app
   - Take clear screenshot showing amount and status
   - Verify transaction shows "Success" or "Completed"

2. **For Bank Account**
   - Get transaction reference number from bank
   - Take screenshot from bank confirmation email
   - Include transfer amount and date in screenshot
   - Wait for bank processing before submitting

3. **For PayPal**
   - Complete payment and stay on confirmation page
   - Screenshot PayPal confirmation with amount
   - Copy transaction ID from PayPal confirmation
   - Ensure screenshot clearly shows transaction ID

4. **For Melange Portal**
   - Complete payment on Melange website
   - Screenshot the final confirmation page
   - Copy transaction ID from confirmation
   - Ensure amount matches registration amount

---

## Admin Verification Process

### **Admin Dashboard Review:**

1. **View Rejected Registrations**
   - Filter by status: "rejected"
   - Review registration details
   - Check payment screenshot quality
   - Verify transaction ID authenticity

2. **Approve/Re-Reject Decision**
   - ✅ Approve: Payment verified
   - ❌ Reject: Provide specific reason

3. **Notification to User**
   - Email sent with decision
   - If rejected: Reason provided
   - If approved: Confirmation email with next steps

---

## Testing Checklist

- [ ] Rejected registration shows correct status
- [ ] Rejection reason displays properly
- [ ] Previous payment method is shown
- [ ] "Resubmit Registration" button visible
- [ ] Click resubmit clears all fields
- [ ] Form reappears after resubmit
- [ ] User can change payment method on retry
- [ ] Category selection available again
- [ ] Can upload different screenshot
- [ ] Can enter different transaction ID
- [ ] Submit validation works correctly
- [ ] New submission goes to correct endpoint

---

## Error Messages & Reasons

| Reason | Action |
|--------|--------|
| "Invalid transaction ID" | Verify ID from payment receipt, re-enter carefully |
| "Screenshot quality too low" | Take clearer photo, ensure text is readable |
| "Amount mismatch" | Verify amount matches registration, check currency |
| "Transaction not found" | Verify transaction actually completed, try different method |
| "Duplicate transaction" | Don't reuse same transaction ID, process new payment |
| "Payment method mismatch" | Ensure screenshot matches selected payment method |
| "Fraudulent activity detected" | Contact support team directly |

---

## Status Flow Diagram

```
User Submits Registration
        ↓
Admin Reviews Payment
    ↙           ↘
 ✅ Approved   ❌ Rejected
    ↓              ↓
Verified        Rejected Screen
Status          + Reason
                + Resubmit Button
                     ↓
              User Clicks Resubmit
                     ↓
              Form Clears
                     ↓
              Try Different Method
                     ↓
              New Submission
```

---

## Future Enhancements

1. **Automatic Screenshot Validation**
   - Detect image quality issues
   - Alert user before submission

2. **Payment Method Auto-Detection**
   - Suggest alternative methods
   - Show success rates by method

3. **Help Center Integration**
   - Link to payment troubleshooting guides
   - Live chat support option

4. **Admin Notes**
   - Allow admins to add detailed notes
   - Show notes to user on rejection

5. **Rate Limiting**
   - Prevent excessive resubmission attempts
   - Suggest contacting support after 3 rejections

---

**Status:** PRODUCTION READY ✅
**Version:** 1.2.0
**Updated:** 2025-12-10
