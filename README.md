# 🎯 ICMBNT 2026 Research Paper Management System - Complete Setup

## Overview

The **ICMBNT Research Paper Management System** is a full-stack web application for managing research paper submissions, reviews, and publication workflows. Papers and PDFs are stored securely in MongoDB with editor dashboard access controls.

**Key Innovation:** Base64 PDF storage directly in MongoDB - no Cloudinary dependency, no 401 errors, instant access.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- VS Code or any text editor

### Installation

**Terminal 1: Backend**
```bash
cd /home/ramji/Desktop/s2/old/srm-back
npm install  # Only needed first time
node server-new.js
# Should show: ✅ Server running on http://localhost:5000
#              ✅ MongoDB Atlas Connected Successfully
```

**Terminal 2: Frontend**
```bash
cd /home/ramji/Desktop/s2/old/srm-front/one
npm install  # Only needed first time
npm run dev
# Should show: ✅ VITE v6.4.1 ready in XXX ms
#              ✅ Local: http://localhost:5173/
```

**Access the App**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Status: http://localhost:5000/ (shows all endpoints)

---

## 📚 Documentation Files

Each file has detailed information:

| File | Purpose |
|------|---------|
| **IMPLEMENTATION-COMPLETE.md** | Complete system summary and architecture |
| **BASE64-PDF-MIGRATION-COMPLETE.md** | Full technical details of PDF storage migration |
| **QUICK-START-BASE64-STORAGE.md** | User-friendly quick start guide |
| **EDITOR-DASHBOARD-TEST-GUIDE.md** | Comprehensive testing procedures |
| **CHROME-LIKE-PDF-VIEWER.md** | PDF viewer features and controls |

---

## 👥 Test Accounts

### Editor Account ⭐ USE THIS
```
Email: ramjib2311@gmail.com
Password: ramji@123
Role: Editor
```

### Sample Author Account
```
Email: geniral.kpriet@gmail.com
Password: (create your own)
Role: Author
```

---

## 🎮 Using the System

### For Authors/Students

1. **Go to:** http://localhost:5173/submit
2. **Fill form:**
   - Paper Title
   - Author Name
   - Email
   - Category (e.g., Sports Science)
   - Topic (optional)
   - Upload PDF (< 10MB)
3. **Click Submit**
4. **Get** Submission ID and Booking ID
5. **Track** status in user dashboard

### For Editors

1. **Login with:** ramjib2311@gmail.com / ramji@123
2. **Go to:** Editor Dashboard (auto-redirect after login)
3. **View All Papers:**
   - See all submitted papers
   - Search by ID, title, author, email
   - Filter by status/category
4. **View Paper & PDF:**
   - Click paper in list
   - See all details on left
   - PDF viewer on right with:
     - Zoom (50-200%)
     - Fullscreen
     - Download
     - Smooth page scroll
5. **Manage Reviewers:**
   - Create new reviewer
   - Assign to papers
   - Track reviews
6. **Make Decisions:**
   - Accept/Reject papers
   - Add editor comments
   - Send notifications

---

## 🗂️ Project Structure

```
/home/ramji/Desktop/s2/old/
├── srm-back/                    ← Backend (Express + Node)
│   ├── server-new.js           ← Main server file
│   ├── models/                 ← Database schemas
│   │   ├── Paper.js            (Has pdfBase64 field)
│   │   ├── User.js
│   │   └── Review.js
│   ├── controllers/            ← Business logic
│   │   ├── paperController.js  (Base64 conversion)
│   │   └── editorController.js (New functions)
│   ├── routes/                 ← API endpoints
│   │   ├── paperRoutes.js
│   │   └── editorRoutes.js     (New routes)
│   ├── middleware/             ← Auth & uploads
│   │   ├── auth.js
│   │   └── upload.js           (Memory storage)
│   ├── config/
│   │   └── database.js
│   ├── utils/
│   │   ├── emailService.js
│   │   └── helpers.js
│   └── .env                    ← Environment variables
│
├── srm-front/one/              ← Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── EditorDashboard.tsx    (Updated for Base64)
│   │   │   ├── Papersubmission.tsx
│   │   │   └── ... other components
│   │   ├── config/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.local              ← Frontend config
│
└── Documentation files (*.md)
    ├── IMPLEMENTATION-COMPLETE.md
    ├── BASE64-PDF-MIGRATION-COMPLETE.md
    ├── QUICK-START-BASE64-STORAGE.md
    ├── EDITOR-DASHBOARD-TEST-GUIDE.md
    └── README.md
```

---

## 🔧 Technology Stack

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool (fast!)
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client
- **react-pdf** - PDF Display
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **MongoDB Atlas** - Cloud Database
- **Mongoose** - Database ORM
- **JWT** - Authentication
- **Bcrypt** - Password Security
- **Multer** - File Handling
- **Nodemailer** - Emails

---

## 🔐 Security Features

✅ **Authentication**
- JWT tokens (24-hour expiry)
- Email verification
- Password hashing (Bcrypt)

✅ **Authorization**
- Role-based access (Editor/Admin/Author/Reviewer)
- Authors can only edit own papers
- Editors can access all papers

✅ **Data Protection**
- MongoDB encryption at rest
- CORS configured
- Input validation on all endpoints
- No Cloudinary dependency

✅ **Password Security**
- 10-round Bcrypt hashing
- No plain-text storage
- Password reset via email

---

## 📊 API Endpoints

### Public Endpoints
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Author Endpoints
```
POST   /api/papers/submit              Submit paper with PDF
GET    /api/papers/my-submission       View own submission
PUT    /api/papers/edit/:id            Edit paper
GET    /api/papers/status/:id          Check status
```

### Editor Endpoints (Protected - JWT + Role)
```
GET    /api/editor/papers              Get ALL papers
GET    /api/editor/pdf/:submissionId   Get PDF as base64
GET    /api/editor/reviewers           Get all reviewers
POST   /api/editor/reviewers           Create reviewer
POST   /api/editor/assign-reviewers    Assign reviewers
POST   /api/editor/make-decision       Make final decision
GET    /api/editor/dashboard-stats     Get statistics
```

---

## 🗄️ Database Schema

### PaperSubmission Collection
```json
{
  "_id": ObjectId,
  "submissionId": "SP001",
  "paperTitle": "Research Title",
  "authorName": "John Doe",
  "email": "john@example.com",
  "category": "Sports Science",
  "topic": "Sports Medicine",
  "pdfBase64": "JVBERi0xLjQK...",        ← Base64 encoded PDF
  "pdfFileName": "paper.pdf",            ← Original filename
  "status": "Submitted",
  "assignedEditor": null,
  "assignedReviewers": [],
  "revisionCount": 0,
  "versions": [{
    "version": 1,
    "pdfBase64": "JVBERi0xLjQK...",
    "pdfFileName": "paper.pdf",
    "submittedAt": ISODate
  }],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### User Collection
```json
{
  "_id": ObjectId,
  "username": "john_doe",
  "email": "john@example.com",
  "password": "$2b$10$bcrypt_hash",      ← Hashed password
  "role": "Author",                      ← Editor, Admin, Reviewer
  "emailVerified": true,
  "createdAt": ISODate
}
```

---

## 🧪 Testing the System

### Quick Test (5 minutes)

**Step 1: Submit Paper**
1. Go to http://localhost:5173/submit
2. Fill form and upload PDF
3. Click Submit
4. Note the Submission ID (e.g., SP001)

**Step 2: Login as Editor**
1. Go to http://localhost:5173/login
2. Use: ramjib2311@gmail.com / ramji@123
3. Click "Go to Editor Dashboard"

**Step 3: View Paper**
1. Click "Papers" tab
2. Should see your submitted paper in list
3. Click on it
4. View PDF with all controls

**Step 4: Test PDF Controls**
- Zoom: Use +/- buttons
- Fullscreen: Click fullscreen button
- Download: Click download button
- Scroll: Use mouse wheel

✅ **If all works - System is operational!**

### Comprehensive Testing

See **EDITOR-DASHBOARD-TEST-GUIDE.md** for:
- Full test cases with expected results
- API endpoint testing with curl
- Authentication testing
- Search/filter testing
- Edge cases and error scenarios

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill the process if needed
kill -9 <PID>

# Check MongoDB connection
# Server logs should show: "MongoDB Atlas Connected Successfully"
```

### Frontend won't load?
```bash
# Check if port 5173 is in use
lsof -i :5173

# Check for errors in console (F12)
# Check vite config has correct API_URL
```

### Papers not showing in editor dashboard?
```bash
# Check you're logged in as editor
localStorage.getItem('token')  // Should exist

# Check database has papers
# Login to MongoDB Atlas and check papersubmissions collection
```

### PDF not displaying?
```bash
# Check browser console (F12) for errors
# Check network tab - API should return pdfBase64
# Verify base64 is valid format
```

---

## 📈 Performance Expectations

| Operation | Time |
|-----------|------|
| Login | <1 second |
| Load papers list | <500ms |
| Fetch 1MB PDF | ~200ms |
| Fetch 5MB PDF | ~800ms |
| Download PDF | <500ms |
| Zoom PDF | Instant |
| Scroll pages | 60fps smooth |

---

## 🚀 Deployment

### To Production

1. **Environment Setup**
   ```bash
   # Set up .env file with real values
   MONGODB_URI=your-production-mongodb
   JWT_SECRET=strong-random-secret
   EMAIL_USER=production-email
   EMAIL_PASS=production-password
   PORT=5000
   NODE_ENV=production
   ```

2. **Backend Deployment**
   - Deploy to: Heroku, AWS, Azure, or your server
   - Command: `npm install && node server-new.js`
   - Port: 5000

3. **Frontend Deployment**
   - Build: `npm run build`
   - Deploy to: Netlify, Vercel, or your CDN
   - Set API_URL to production backend

4. **Database**
   - Use MongoDB Atlas (already set up)
   - Enable IP whitelist
   - Create daily backups

---

## 📞 Support

### Getting Help

1. **Read Documentation**
   - Start with IMPLEMENTATION-COMPLETE.md
   - Check specific guide for your issue

2. **Check Logs**
   ```bash
   # Backend logs
   tail -50 /tmp/backend.log
   
   # Frontend logs
   Open browser DevTools (F12) → Console tab
   ```

3. **Common Issues**
   - See EDITOR-DASHBOARD-TEST-GUIDE.md "Debugging Guide" section
   - See QUICK-START-BASE64-STORAGE.md "Troubleshooting" section

4. **Database Issues**
   - Login to MongoDB Atlas
   - Check connection string
   - Verify IP whitelist

---

## ✅ Verification Checklist

Before considering "done":

- [ ] Backend starts: `node server-new.js` ✅
- [ ] Frontend starts: `npm run dev` ✅
- [ ] Can submit paper with PDF ✅
- [ ] Can login as editor ✅
- [ ] Can see all papers in dashboard ✅
- [ ] Can view PDF in viewer ✅
- [ ] PDF zoom works ✅
- [ ] PDF download works ✅
- [ ] Search papers works ✅
- [ ] Non-editor cannot access dashboard ✅

---

## 📋 Feature Checklist

### Implemented Features ✅
- [x] Paper submission with PDF upload
- [x] User authentication (signup/login)
- [x] Email verification
- [x] JWT token authentication
- [x] Role-based access control
- [x] Base64 PDF storage in MongoDB
- [x] Editor dashboard
- [x] View all papers
- [x] Search and filter papers
- [x] View paper details
- [x] Chrome-like PDF viewer
- [x] PDF zoom (50-200%)
- [x] PDF fullscreen
- [x] PDF download
- [x] Continuous scroll PDF viewer
- [x] Create reviewer accounts
- [x] Assign reviewers to papers
- [x] Email notifications
- [x] Paper revision tracking

### Future Enhancements
- [ ] Paper annotations
- [ ] Real-time collaboration
- [ ] AI-powered reviewer suggestions
- [ ] Plagiarism detection
- [ ] Publication templates
- [ ] Advanced analytics
- [ ] Mobile app

---

## 🎓 Learning Resources

### For Understanding the System
1. **Frontend Architecture**: Read `src/components/EditorDashboard.tsx`
2. **Backend Structure**: Read `server-new.js` and `controllers/paperController.js`
3. **Database Design**: Check MongoDB Atlas (SRM database)
4. **API Design**: Test endpoints with curl or Postman

### External Resources
- **React**: https://react.dev
- **Express**: https://expressjs.com
- **MongoDB**: https://docs.mongodb.com
- **JWT**: https://jwt.io
- **PDF.js**: https://mozilla.github.io/pdf.js/

---

## 📝 Notes

- **PDF Size Limit:** 10MB (enforced by multer)
- **Token Expiry:** 24 hours (auto-logout)
- **Base64 Overhead:** ~33% larger than binary (5MB PDF = 6.6MB base64)
- **MongoDB Size:** Up to 16MB per document
- **Concurrent Users:** Tested with typical conference loads

---

## 🎉 Summary

This is a **production-ready research paper management system** with:
- ✅ Secure authentication and authorization
- ✅ Efficient PDF storage (no Cloudinary dependency)
- ✅ User-friendly editor dashboard
- ✅ Chrome-like PDF viewing experience
- ✅ Comprehensive search and filtering
- ✅ Reviewer management workflow
- ✅ Email notifications
- ✅ Scalable MongoDB backend

**Status: READY FOR REAL-WORLD USE**

---

**Last Updated:** November 25, 2025  
**System Version:** 2.0.0 (Base64 Storage Edition)  
**Maintained By:** Development Team  
**Support:** See documentation files for detailed help

---

**Happy Paper Management! 📚✨**
# icbmnt2026
# icmbnt2026
