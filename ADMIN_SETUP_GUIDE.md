# Admin Setup & User Role Guide

## System Architecture

Your ICMBNT 2026 system has a hierarchical role-based access control:

### **User Roles**

| Role | Permissions | Access |
|------|-------------|--------|
| **Admin** | • Create/manage Editors<br>• Assign Editors to papers<br>• View all users<br>• Access Admin Dashboard<br>• Dashboard statistics | `/dashboard` |
| **Editor** | • Assign Reviewers to papers<br>• View all submissions<br>• Create Reviewer accounts<br>• Access Editor Dashboard<br>• Review reviewer feedback | `/dashboard` (Editor view) |
| **Reviewer** | • View assigned papers<br>• Submit reviews<br>• View reviewer feedback<br>• Send messages to Editor | `/reviewer` |
| **Author** | • Submit papers<br>• Edit submissions<br>• Track submission status<br>• View reviewer comments | `/dashboard` (Author view) |

---

## Setup Instructions

### **1. Create Top Admin User**

Run this command to create the admin account:

```bash
cd srm-back2
node scripts/setup-admin.js
```

**Result:**
```
✓ Admin user created successfully!
   Email: societyforcis.org@gmail.com
   Username: admin
   Password: Admin@12345 (SAVE THIS)
   Role: Admin
```

**⚠️ IMPORTANT:** Change the default password after first login!

---

### **2. Admin Login**

1. Go to: `https://icmbnt2026-yovz.vercel.app/login`
2. Enter:
   - Email: `societyforcis.org@gmail.com`
   - Password: `Admin@12345`
3. Click **Sign in**
4. You'll be redirected to `/dashboard` (Admin view)

---

### **3. Creating Editor Accounts**

As Admin, you can create Editor accounts via API or UI:

#### **Via API (POST /api/admin/editors)**
```bash
curl -X POST https://icmbnt2026.vercel.app/api/admin/editors \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor@example.com",
    "username": "editor_name",
    "password": "EditorPassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Editor account created successfully",
  "editor": {
    "id": "user_id_123",
    "email": "editor@example.com",
    "username": "editor_name",
    "role": "Editor"
  },
  "temporaryPassword": null
}
```

#### **Via Dashboard (UI)**
1. Login as Admin
2. Go to **Admin Dashboard**
3. Click **Create Editor** button
4. Fill in email and password
5. Click **Create**

---

### **4. Assign Editor to Papers**

Once an Editor is created, assign them to papers:

#### **Via API (POST /api/admin/assign-editor)**
```bash
curl -X POST https://icmbnt2026.vercel.app/api/admin/assign-editor \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": "paper_id_123",
    "editorId": "editor_id_456"
  }'
```

#### **Via Dashboard**
1. Login as Admin
2. Go to **Manage Papers**
3. Select a paper
4. Click **Assign Editor**
5. Choose the Editor from dropdown
6. Click **Confirm**

---

### **5. Editor Login & Access Control**

Editors can now:

1. Login with their email: `editor@example.com`
2. Access **Editor Dashboard** at `/dashboard`
3. View all assigned papers
4. Create Reviewer accounts
5. Assign Reviewers to papers
6. View and manage reviews

**Key Permissions:**
- ✅ Can create Reviewers
- ✅ Can assign Reviewers to papers
- ✅ Can view all submissions
- ✅ Cannot modify admin settings
- ✅ Cannot create other Editors

---

### **6. Login Flow Summary**

```
┌─────────────────────────────────────┐
│   User Opens Login Page              │
│   https://icmbnt2026-yovz...../login │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │ Enter Email  │
        │ & Password   │
        └──────┬───────┘
               │
        ┌──────▼───────────┐
        │ System Validates  │
        │ Credentials       │
        └──────┬───────────┘
               │
        ┌──────▼────────────────┐
        │ Check User Role        │
        └──────┬────────────────┘
               │
     ┌─────────┼─────────┬──────────┐
     │         │         │          │
     ▼         ▼         ▼          ▼
   ADMIN    EDITOR   REVIEWER    AUTHOR
     │         │         │          │
     │         │         │          │
     ▼         ▼         ▼          ▼
  /dash    /dash      /reviewer  /dashboard
 (Admin)  (Editor)              (Author)
```

---

## API Endpoints

### **Admin Endpoints** (`/api/admin/*`)
- `POST   /api/admin/editors` - Create new Editor
- `GET    /api/admin/editors` - Get all Editors
- `POST   /api/admin/assign-editor` - Assign Editor to paper
- `POST   /api/admin/reassign-editor` - Reassign Editor
- `GET    /api/admin/users` - Get all users
- `DELETE /api/admin/users/:userId` - Delete user
- `GET    /api/admin/dashboard-stats` - Dashboard statistics

### **Editor Endpoints** (`/api/editor/*`)
- `GET    /api/editor/papers` - Get all papers
- `GET    /api/editor/reviewers` - Get all Reviewers
- `POST   /api/editor/reviewers` - Create new Reviewer
- `POST   /api/editor/assign-reviewers` - Assign Reviewers to paper
- `GET    /api/editor/papers/:paperId/reviews` - Get paper reviews
- `GET    /api/editor/verify-access` - Verify Editor access

### **Auth Endpoints** (`/api/auth/*`)
- `POST   /api/auth/login` - User login
- `POST   /api/auth/register` - New user registration
- `POST   /api/auth/signin` - Alternative signin
- `GET    /api/auth/verify-email` - Verify email
- `POST   /api/auth/forgot-password` - Request password reset
- `POST   /api/auth/reset-password` - Reset password
- `GET    /api/auth/me` - Get current user info

---

## Security Best Practices

✅ **Do:**
- Change default admin password after first login
- Use strong passwords (min 8 chars, uppercase, lowercase, numbers, symbols)
- Keep JWT tokens secure in localStorage
- Use HTTPS for all connections
- Regularly audit user access logs

❌ **Don't:**
- Share admin credentials
- Store passwords in plain text
- Use same password for multiple accounts
- Commit passwords to git repository

---

## Troubleshooting

### **Admin can't login**
1. Verify MongoDB connection
2. Check `.env` file for correct `MONGODB_URI`
3. Run `node scripts/setup-admin.js` again
4. Check browser console for error messages

### **Editor can't access Editor Dashboard**
1. Verify Editor role is set to `'Editor'` in database
2. Check JWT token validity
3. Verify Bearer token in Authorization header
4. Check role-based middleware in `roleCheck.js`

### **Cannot create Editor**
1. Verify Admin is logged in
2. Check Admin token in Authorization header
3. Verify email is not already in database
4. Check MongoDB connection

### **CORS Issues**
1. Verify frontend URL is in `ALLOWED_ORIGINS` in backend `.env`
2. Check CORS configuration in `server.js`
3. Ensure preflight requests (OPTIONS) are allowed

---

## Next Steps

1. ✅ Run setup script to create Admin account
2. ✅ Login with Admin credentials
3. ✅ Create Editor accounts via Admin Dashboard
4. ✅ Assign Editors to papers
5. ✅ Editors create and assign Reviewers
6. ✅ System ready for use!

---

**Questions?** Contact: icmbnt2025@gmail.com
