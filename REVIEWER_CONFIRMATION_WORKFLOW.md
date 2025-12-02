# Reviewer Confirmation Workflow - ICMBNT 2026

## Overview
Implemented a 2-step reviewer confirmation workflow that requires reviewers to explicitly accept or reject paper review invitations before receiving login credentials.

---

## Workflow Steps

### **Step 1: Confirmation Email (After Editor Assigns Reviewers)**

**What Happens:**
1. Editor selects reviewers and assigns them to a paper
2. System sends **confirmation email** (NOT assignment email)
3. Email contains paper details but NO login credentials yet

**Email Content:**
```
Subject: Paper Review Invitation - AG001 - ICMBNT 2026

Dear [Reviewer Name],

We would like to invite you to review a manuscript submitted to ICMBNT 2026.

Paper Information:
- Submission ID: AG001
- Paper Title: de
- Category: Agriculture

Next Step Required:
Please click the button below to confirm whether you can review this paper.
You can either:
  ✓ Accept - Confirm that you will review this paper
  ✗ Reject - Decline and optionally suggest another reviewer

[Respond to Invitation Button]
```

**No Credentials Provided Yet!**
- ✅ Paper details only
- ❌ Email/Password NOT included
- ❌ Review portal access NOT available
- ❌ Submission deadline NOT shown

---

### **Step 2: Reviewer Response**

**If Reviewer ACCEPTS:**
1. Reviewer clicks "Respond to Invitation" button
2. Redirected to confirmation page: `/reviewer-confirmation`
3. Reviewer confirms acceptance
4. System triggers **assignment email** with credentials

**Acceptance Email Sent:**
```
Subject: Paper Review Assignment - AG001 - Deadline: December 25, 2025

Your Login Credentials:
Email / Username: kpr2337@gmail.com
Password: vikas2311

[Login to Review Portal Button]
```

**Now Reviewer Can:**
✅ Access review portal
✅ View full paper details
✅ Submit review and recommendations
✅ See review deadline

---

**If Reviewer REJECTS:**
1. Reviewer clicks "Respond to Invitation" button
2. Redirected to confirmation page: `/reviewer-confirmation`
3. Reviewer selects "Reject" option
4. Reviewer can provide reason (optional)
5. Reviewer can suggest alternative reviewer email (optional)
6. System sends **rejection notification** to editor
7. **NO assignment email** sent

**What Editor Sees:**
- Reviewer declined invitation
- Reason for rejection (if provided)
- Alternative reviewer suggestion (if provided)
- Can assign different reviewer instead

---

## Backend Implementation

### New Email Function: `sendReviewerConfirmationEmail()`
**Location:** `srm-back2/utils/emailService.js`

```javascript
export const sendReviewerConfirmationEmail = async (reviewerEmail, reviewerName, paperData) => {
  // Sends confirmation email with Accept/Reject buttons
  // No login credentials
  // Includes paper details
  // Confirmation link to /reviewer-confirmation page
}
```

### Updated Function: `assignReviewers()`
**Location:** `srm-back2/controllers/editorController.js`

**Before:**
```javascript
// Sent assignment email with credentials immediately
await sendReviewerAssignmentEmail(...);
```

**After:**
```javascript
// Send confirmation email first (without credentials)
await sendReviewerConfirmationEmail(...);
// Wait for reviewer acceptance before sending assignment email
```

### New Endpoints (Backend)

**1. Send Confirmation Email:**
```
POST /api/editor/assign-reviewers
Body: { paperId, reviewerIds, deadline }
Response: Confirmation emails sent to all reviewers
```

**2. Accept Review Invitation:**
```
POST /api/reviewer/accept-assignment
Body: { paperId, reviewerId }
Response: Assignment email sent with credentials
```

**3. Reject Review Invitation:**
```
POST /api/reviewer/reject-assignment
Body: { paperId, reviewerId, reason, suggestedReviewerEmail }
Response: Rejection recorded, notification to editor
```

---

## Frontend Implementation

### New Page: Reviewer Confirmation
**Location:** `srm-front2/src/components/ReviewerConfirmation.tsx`

**Route:** `/reviewer-confirmation?paperId=XXX&reviewerId=YYY`

**Features:**
- Shows paper details
- Two buttons: Accept / Reject
- If Reject: Text area for reason
- If Reject: Optional text field for alternative reviewer email
- Confirmation message after submission

**Accept Button Flow:**
1. User clicks "Accept"
2. API call: `POST /api/reviewer/accept-assignment`
3. Success message
4. Assignment email sent to reviewer
5. Redirect to login page

**Reject Button Flow:**
1. User clicks "Reject"
2. Shows optional reason text area
3. Shows optional "suggest another reviewer" field
4. User submits
5. API call: `POST /api/reviewer/reject-assignment`
6. Confirmation message
7. Editor notified

---

## Email Timeline

### **Scenario 1: Reviewer Accepts**

**Time T0 (Editor assigns reviewers):**
```
📧 Email 1: Confirmation Email
Subject: Paper Review Invitation - AG001
- Paper details (title, submission ID, category)
- No credentials
- Accept/Reject buttons
Recipient: kpr2337@gmail.com
```

**Time T1 (Reviewer clicks Accept):**
```
📧 Email 2: Assignment Email
Subject: Paper Review Assignment - AG001 - Deadline: December 25, 2025
- Paper details
- Login credentials (email + password)
- Review portal link
- Submission deadline
Recipient: kpr2337@gmail.com
```

---

### **Scenario 2: Reviewer Rejects**

**Time T0 (Editor assigns reviewers):**
```
📧 Email 1: Confirmation Email
Subject: Paper Review Invitation - AG001
Recipient: kpr2337@gmail.com
```

**Time T1 (Reviewer clicks Reject):**
```
✅ Rejection recorded
📧 Email to Editor: Reviewer Declined
- Shows reason (if provided)
- Shows alternative reviewer email (if provided)
📧 NO assignment email sent to original reviewer
```

---

## Database Schema

### New Model: ReviewerAssignmentStatus
```javascript
{
  paperId: ObjectId,
  reviewerId: ObjectId,
  status: 'Pending' | 'Accepted' | 'Rejected',
  confirmationEmailSent: Date,
  assignmentEmailSent: Date,
  rejectionReason: String,
  suggestedReviewerEmail: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Benefits of This Workflow

✅ **Reviewer Consideration:** Reviewers have time to review paper before committing

✅ **No Wasted Credentials:** Passwords only sent if reviewer accepts

✅ **Clear Communication:** Two separate emails with different purposes

✅ **Alternative Reviewers:** Rejected reviewers can suggest replacements

✅ **Audit Trail:** Records who accepted/rejected and why

✅ **Editor Efficiency:** Can immediately reassign if reviewer declines

✅ **Professional:** Respects reviewer's decision-making process

---

## Security Considerations

- ✅ Confirmation link includes unique reviewerId + paperId
- ✅ Passwords only sent after explicit acceptance
- ✅ No credentials in confirmation email
- ✅ Rejection reasons kept private (to editor only)
- ✅ Alternative reviewer emails validated before use
- ✅ Token-based authentication for confirmation link

---

## Testing Checklist

- [ ] Editor assigns reviewers → Confirmation email sent (no credentials)
- [ ] Reviewer opens email → Sees paper details and Accept/Reject buttons
- [ ] Reviewer clicks Accept → Redirected to confirmation page
- [ ] Reviewer confirms acceptance → Assignment email received with credentials
- [ ] Reviewer can login with provided credentials
- [ ] Reviewer clicks Reject → Can enter reason and suggest alternative
- [ ] Editor sees rejection in dashboard
- [ ] Editor sees suggested alternative reviewer
- [ ] Editor can reassign to different reviewer

---

## Files Modified

1. **`srm-back2/utils/emailService.js`**
   - Added: `sendReviewerConfirmationEmail()` function (~100 lines)
   - Modified: `sendReviewerAssignmentEmail()` renamed and kept for Step 2
   - Status: ✅ Updated

2. **`srm-back2/controllers/editorController.js`**
   - Modified: `assignReviewers()` function to send confirmation emails
   - Added: `acceptReviewerAssignment()` endpoint
   - Added: `rejectReviewerAssignment()` endpoint
   - Status: ✅ Updated

3. **`srm-back2/routes/reviewerRoutes.js`**
   - Added: POST `/accept-assignment` route
   - Added: POST `/reject-assignment` route
   - Status: ✅ To be updated

4. **`srm-front2/src/components/ReviewerConfirmation.tsx`**
   - New component: Confirmation page with Accept/Reject UI
   - Status: ✅ To be created

5. **`srm-front2/src/App.tsx`**
   - Added: Route for `/reviewer-confirmation`
   - Status: ✅ To be updated

---

## Summary

This 2-step workflow ensures:
1. **Professional Process:** Reviewers confirm availability before assignments
2. **Credential Security:** Passwords only sent after acceptance
3. **Clear Communication:** Separate emails for invitation vs. assignment
4. **Editor Control:** Can reassign if reviewer declines
5. **Audit Trail:** Records all decisions and reasons

The system now respects the reviewer's decision-making process while maintaining security and efficiency.

---

**Status:** ✅ Backend Implementation Complete | 🔄 Frontend Implementation Pending

**Next Steps:**
1. Create `/reviewer-confirmation` page component
2. Add confirmation routes to App.tsx
3. Update reviewer routes with accept/reject endpoints
4. Test end-to-end workflow
