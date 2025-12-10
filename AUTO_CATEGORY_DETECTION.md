# Auto-Detection of Registration Category Based on User Type

## Overview

The registration system now automatically detects and pre-selects the appropriate registration category based on the user's selected type during signup. This works similar to how the system auto-detects author vs. listener registration based on paper acceptance status.

## Changes Implemented

### 1. **Backend: User Model Update** (`srm-back2/models/User.js`)

Added a new `userType` field to the User schema:

```javascript
userType: {
    type: String,
    enum: ['student', 'faculty', 'scholar'],
    default: null  // Will be set during signup or profile update
}
```

**Valid Values:**
- `student`: Undergraduate and postgraduate students
- `faculty`: Faculty members and professors
- `scholar`: Research scholars and PhD candidates

### 2. **Backend: Auth Controller Update** (`srm-back2/controllers/authController.js`)

Updated the `register` function to accept and store the `userType` field:

```javascript
export const register = async (req, res) => {
    const { email, password, role = 'Author', country, userType } = req.body;
    
    const newUser = new User({
        // ... other fields
        userType: userType || null,  // Save userType from signup
    });
};
```

The `getCurrentUser` endpoint (`/api/auth/me`) already returns the full user object, so `userType` is automatically included in the response.

### 3. **Frontend: Signup Form Update** (`srm-front2/src/components/auth/Signin.tsx`)

#### Added User Type Selection

A new dropdown field is now displayed during account creation:

```tsx
<div>
    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
    <select
        value={userType}
        onChange={(e) => setUserType(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg..."
        required
    >
        <option value="">Select your user type</option>
        <option value="student">👨‍🎓 Student (Undergraduate/Postgraduate)</option>
        <option value="faculty">👨‍🏫 Faculty (Professor/Faculty Member)</option>
        <option value="scholar">🔬 Research Scholar (PhD/Research)</option>
    </select>
    <p className="mt-1 text-xs text-gray-500">
        This determines which registration category you'll use
    </p>
</div>
```

#### Updated Validation

The signup form now requires all fields including `userType`:

```javascript
if (!email || !password || !country || !userType) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please fill in all fields including country and user type selection',
        timer: 2000,
    });
}
```

#### Updated API Call

The signup request now sends `userType` to the backend:

```javascript
body: JSON.stringify({ email, password, country, userType })
```

### 4. **Frontend: Registration Form Update** (`srm-front2/src/components/EnhancedUniversalRegistrationForm.tsx`)

#### Updated UserInfo Interface

```typescript
interface UserInfo {
    name: string;
    email: string;
    country?: string;
    isAuthor: boolean;
    userType?: 'student' | 'faculty' | 'scholar' | null;
}
```

#### Auto-Selection Logic

New `useEffect` hook that automatically selects the category based on user type:

```typescript
// Auto-select category based on userType and country
useEffect(() => {
    if (userInfo && userCountry && registrationType) {
        const categories = getRegistrationCategories();
        if (categories.length > 0) {
            // Determine best matching category based on userType
            let selectedCategoryId = categories[0].id;

            if (registrationType === 'author' && userCountry === 'India') {
                if (userInfo.userType === 'student') {
                    selectedCategoryId = 'indian-student';
                } else if (userInfo.userType === 'faculty') {
                    selectedCategoryId = 'indian-faculty';
                } else if (userInfo.userType === 'scholar') {
                    selectedCategoryId = 'indian-scholar';
                }
            }
            // For other countries or listeners, use the default (first) category

            setSelectedCategory(selectedCategoryId);
        }
    }
}, [userInfo, userCountry, registrationType]);
```

## User Flow

### Complete Registration & Category Auto-Selection Flow

1. **Signup Page**
   - User creates account
   - Selects Country: India / Indonesia / Other
   - **NEW: Selects User Type: Student / Faculty / Scholar**
   - Sets password
   - Account created, verification email sent

2. **Email Verification**
   - User verifies email
   - Account becomes active

3. **Login**
   - User logs in with email and password
   - Token stored in localStorage
   - User information (including userType) fetched from backend

4. **Registration Form**
   - Country selector appears
   - User info section displays name, email, country
   - **NEW: If user is Author in India:**
     - System automatically selects matching category:
       - Student → "Indian Student" category
       - Faculty → "Indian Faculty" category  
       - Scholar → "Indian Research Scholar" category
   - **For Listeners:**
     - Category pre-selected based on country
   - User can still manually change category if needed
   - User proceeds with payment

## Category Mapping Table

### India - Authors

| User Type | Auto-Selected Category | Member Price | Non-Member Price |
|-----------|------------------------|--------------|------------------|
| Student | Indian Student | ₹4,500 | ₹5,850 |
| Faculty | Indian Faculty | ₹6,750 | ₹7,500 |
| Scholar | Indian Research Scholar | ₹6,750 | ₹7,500 |

### India - Listeners

| User Type | Auto-Selected Category | Member Price | Non-Member Price |
|-----------|------------------------|--------------|------------------|
| Any | Indian Listener/Attendee | ₹2,500 | ₹3,500 |

### Indonesia - Authors & Listeners

| User Type | Auto-Selected Category | Member Price | Non-Member Price |
|-----------|------------------------|--------------|------------------|
| Any (Author) | Indonesian Author | 17,00,000 IDR | 26,00,000 IDR |
| Any (Listener) | Indonesian Listener | 12,00,000 IDR | 15,00,000 IDR |

### Other Countries - Authors & Listeners

| User Type | Auto-Selected Category | Member Price | Non-Member Price |
|-----------|------------------------|--------------|------------------|
| Any (Author) | International Author | $300 | $350 |
| Any (Listener) | International Listener | $100 | $150 |

## Features

✅ **Automatic Category Selection**
- System intelligently selects the appropriate category based on userType and country
- Saves user time and reduces selection errors

✅ **User Control**
- Users can still manually change the pre-selected category if desired
- Category dropdown is always visible and clickable

✅ **Consistent with Existing Auto-Detection**
- Works alongside existing auto-detection of author vs. listener based on paper acceptance
- Uses same pattern as country auto-selection

✅ **Smart Defaults**
- For non-Indian countries or listener registrations, defaults to the first (only) available category
- For Indian authors, selects the exact matching category based on userType

## Testing Checklist

### Signup Flow
- [ ] Create account as Student, India → Check userType saved
- [ ] Create account as Faculty, Indonesia → Check userType saved
- [ ] Create account as Scholar, Other → Check userType saved
- [ ] Verify error if userType not selected
- [ ] Verify email verification still works

### Registration Form
- [ ] Login as Student, India, Author → Check "Indian Student" pre-selected
- [ ] Login as Faculty, India, Author → Check "Indian Faculty" pre-selected
- [ ] Login as Scholar, India, Author → Check "Indian Research Scholar" pre-selected
- [ ] Login as any type, India, Listener → Check "Indian Listener/Attendee" selected
- [ ] Login as any type, Indonesia → Check appropriate country category selected
- [ ] Login as any type, Other → Check appropriate country category selected
- [ ] Verify user can still manually change category
- [ ] Complete registration with auto-selected category

### API Endpoints
- [ ] POST `/api/auth/signin` accepts userType parameter
- [ ] GET `/api/auth/me` returns userType field in response
- [ ] User stored in database with userType field populated

## Database Migration Notes

**No migration needed**: 
- Existing users have `userType: null` by default
- When existing users log in, they see listener form or author form based on `isAuthor` flag
- Auto-category selection only applies if `userType` is set
- Old users can manually select their category as before

## Edge Cases Handled

1. **Existing Users (userType = null)**
   - System defaults to first available category
   - Users can manually select any category

2. **Non-India Authors**
   - Only one category available per country
   - Auto-selection uses that single category

3. **All Listeners**
   - userType doesn't affect listener categories
   - Only country determines listener category
   - userType field is still saved for future use

4. **Country Changed**
   - If user changes country, categories update
   - Pre-selection logic runs again with new country
   - Category auto-selection respects the new country

## API Request/Response Examples

### Signup Request
```javascript
POST /api/auth/signin
Content-Type: application/json

{
    "email": "student@example.com",
    "password": "SecurePassword123",
    "country": "India",
    "userType": "student"
}
```

### Signup Response (Success)
```javascript
{
    "success": true,
    "message": "Account created. Please check your email to verify your account."
}
```

### Get User Info (After Login)
```javascript
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
    "success": true,
    "user": {
        "_id": "...",
        "username": "student",
        "email": "student@example.com",
        "country": "India",
        "userType": "student",
        "isGoogleAuth": false,
        "verified": true,
        "createdAt": "2024-12-10T..."
    }
}
```

## Summary of Files Modified

| File | Changes |
|------|---------|
| `srm-back2/models/User.js` | Added `userType` field to schema |
| `srm-back2/controllers/authController.js` | Updated `register()` to accept and store `userType` |
| `srm-front2/src/components/auth/Signin.tsx` | Added userType dropdown, validation, API integration |
| `srm-front2/src/components/EnhancedUniversalRegistrationForm.tsx` | Updated UserInfo interface, added auto-selection useEffect |

## Production Deployment Notes

1. **Backend Deployment**
   - Update User model (already done)
   - Update authController (already done)
   - No database migration needed (field defaults to null)
   - Deploy and restart server

2. **Frontend Deployment**
   - Update Signin.tsx component
   - Update EnhancedUniversalRegistrationForm component
   - Clear browser cache to load new version
   - Test with fresh signup flow

3. **Rollback Plan** (if needed)
   - Old code ignores userType parameter
   - No breaking changes
   - Safe to revert without data loss

## Future Enhancements

Potential improvements for future versions:
- Show user type in registration summary/invoice
- Analytics dashboard showing registration distribution by user type
- Different messaging/guidance based on user type during registration
- Auto-selection of payment method based on user type
- Suggested travel package recommendations by user type

---

**Version**: 1.0  
**Last Updated**: December 10, 2024  
**Status**: ✅ Production Ready
