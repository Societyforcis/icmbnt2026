# ICMBNT 2026 - Role & Access Control Reference

## 🔐 User Roles & Permissions

### 👨‍💼 **ADMIN** (societyforcis.org@gmail.com)
**Access Level:** Complete system control

**Can Do:**
- ✅ Create new Editor accounts
- ✅ Create new Reviewer accounts
- ✅ Assign Editors to papers
- ✅ Reassign Editors
- ✅ View all users (Authors, Editors, Reviewers)
- ✅ Delete users from system
- ✅ View dashboard statistics
- ✅ Access full Admin Dashboard

**Login:** `/login` → Email: `societyforcis.org@gmail.com` → Dashboard: `/dashboard`

**Cannot:**
- ❌ Submit papers (that's for Authors)
- ❌ Review papers (that's for Reviewers)

---

### ✏️ **EDITOR** (Created by Admin)
**Access Level:** Paper management & review coordination

**Can Do:**
- ✅ View all submitted papers
- ✅ Assign Reviewers to papers
- ✅ Create new Reviewer accounts
- ✅ View all reviews submitted for papers
- ✅ View reviewer feedback and comments
- ✅ Send messages to reviewers
- ✅ Access Editor Dashboard

**Login:** `/login` → Email: `editor@example.com` → Dashboard: `/dashboard`

**Example Flow:**
```
1. Admin creates Editor with: editor1@university.edu
2. Editor logs in with their email
3. Editor sees all submitted papers
4. Editor assigns Reviewer1 and Reviewer2 to Paper A
5. Editor waits for reviews
6. Editor views completed reviews
7. Editor makes final decision
```

**Cannot:**
- ❌ Delete Editors
- ❌ Submit papers
- ❌ Access Admin settings

---

### 👁️ **REVIEWER** (Created by Editor)
**Access Level:** Paper review only

**Can Do:**
- ✅ View papers assigned to them
- ✅ Submit reviews for papers
- ✅ View feedback from Editor
- ✅ Communicate with Editor
- ✅ Access Reviewer Dashboard

**Login:** `/login` → Email: `reviewer@example.com` → Dashboard: `/reviewer`

**Review Ratings Include:**
- Technical Quality (1-5)
- Clarity (1-5)
- Originality (1-5)
- Recommendation (Accept/Minor Revisions/Major Revisions/Reject)

**Cannot:**
- ❌ Create Editors or Reviewers
- ❌ Access other reviewers' reviews
- ❌ Modify assigned papers

---

### 📝 **AUTHOR** (Self-registering users)
**Access Level:** Paper submission only

**Can Do:**
- ✅ Register with email
- ✅ Submit papers
- ✅ Edit their own submissions
- ✅ View submission status
- ✅ View reviewer comments
- ✅ Download decision letters

**Login:** `/login` → Email: `author@example.com` → Dashboard: `/dashboard`

**Paper Submission Workflow:**
```
1. Author creates account via /signin
2. Author verifies email
3. Author logs in
4. Author submits paper
5. System waits for Editor assignment
6. Reviewers review paper
7. Author views reviewer feedback
```

**Cannot:**
- ❌ Access other authors' papers
- ❌ Create Editors or Reviewers
- ❌ See other submissions

---

## 🔄 System Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                    SYSTEM WORKFLOW                           │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐
│   ADMIN     │ Creates Editor
└──────┬──────┘
       │
       ▼
┌────────────┐
│  EDITOR 1  │ Creates Reviewers & Assigns to Papers
└──────┬─────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
    ┌──────┐         ┌──────┐          ┌──────┐
    │ REV1 │         │ REV2 │          │ REV3 │
    └───┬──┘         └───┬──┘          └───┬──┘
        │                │                 │
        │ Reviews        │ Reviews         │ Reviews
        │ Paper A        │ Paper A         │ Paper B
        │                │                 │
        └────────┬───────┘                 │
                 ▼                         ▼
           ┌──────────┐              ┌────────┐
           │ EDITOR   │              │ EDITOR │
           │ Reviews  │              │ Reviews│
           │ Feedback │              │Feedback│
           └──────────┘              └────────┘

┌──────────┐
│  AUTHORS │ Submit Papers → Wait for Review → View Feedback
└──────────┘
```

---

## 📊 Database Role Values

```javascript
// User Model - role field
{
  role: "Admin"     // System administrator
  role: "Editor"    // Paper editor & reviewer manager
  role: "Reviewer"  // Paper reviewer
  role: "Author"    // Paper author (default for new users)
}
```

---

## 🔐 Access Control Matrix

| Action | Admin | Editor | Reviewer | Author |
|--------|-------|--------|----------|--------|
| Create Editor | ✅ | ❌ | ❌ | ❌ |
| Create Reviewer | ✅ | ✅ | ❌ | ❌ |
| Assign Editor to Paper | ✅ | ❌ | ❌ | ❌ |
| Assign Reviewer to Paper | ✅ | ✅ | ❌ | ❌ |
| View All Papers | ✅ | ✅ | ❌* | ❌** |
| View All Users | ✅ | ❌ | ❌ | ❌ |
| Submit Paper | ❌ | ❌ | ❌ | ✅ |
| Review Paper | ❌ | ❌ | ✅* | ❌ |
| View Reviews | ✅ | ✅ | ✅* | ✅** |
| Delete User | ✅ | ❌ | ❌ | ❌ |
| Access Dashboard | ✅ | ✅ | ✅ | ✅ |

*Reviewer sees only assigned papers  
**Author sees only own papers and reviewer comments

---

## 🚀 Quick Start Commands

### Create Admin
```bash
node scripts/setup-admin.js
```

### Create Editor via API
```bash
curl -X POST https://icmbnt2026.vercel.app/api/admin/editors \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "neweditor@example.com",
    "username": "neweditor",
    "password": "SecurePass123"
  }'
```

### Get All Editors
```bash
curl -X GET https://icmbnt2026.vercel.app/api/admin/editors \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ✅ Implementation Checklist

- [ ] Run `node scripts/setup-admin.js` to create Admin
- [ ] Admin logs in with `societyforcis.org@gmail.com`
- [ ] Admin creates first Editor
- [ ] Editor logs in and creates Reviewers
- [ ] Editor assigns Reviewers to papers
- [ ] Authors submit papers
- [ ] Reviewers review papers
- [ ] System shows feedback to authors
- [ ] All access controls working ✓

---

**Status:** ✅ Role-based access control is fully implemented and ready to use!
