# Email and Venue Corrections - ICMBNT 2026

## Issue Identified
The acceptance emails were showing incorrect conference dates and venue information that didn't match the Home page.

---

## Updates Applied

### ✅ Corrected Conference Information

**OLD (Incorrect):**
- 📌 Conference Dates: March 13-14, 2026
- 🏛️ Venue: KPR Institute of Technology, Coimbatore
- Email: icmbnt2026@kpriet.ac.in

**NEW (Correct - Matching Home Page):**
- 📌 Conference Dates: April 26-27, 2026
- 🏛️ Venue: Bali, Indonesia (Jimbaran)
- 🌐 Format: Hybrid (In-person + Virtual)
- 👥 Organized by: Society for Cyber Intelligent Systems, Puducherry, India
- Email: icmbnt2026@gmail.com

---

## Files Updated

### 1. `srm-back2/utils/emailService.js` - `sendAcceptanceEmail()` Function

**Changed Section:**
```diff
- 📌 Conference Dates: March 13-14, 2026
- 🏛️ Venue: KPR Institute of Technology, Coimbatore

+ 📌 Conference Dates: April 26-27, 2026
+ 🏛️ Venue: Bali, Indonesia (Jimbaran)
+ 🌐 Format: Hybrid (In-person + Virtual)
```

**Next Steps Updated:**
```diff
- Prepare your presentation slides
- Ensure you have a valid travel document for the conference
- Plan your presence for March 13-14, 2026

+ Prepare your presentation slides for April 26-27, 2026
+ Arrange your travel to Bali, Indonesia
+ Join us for this exciting hybrid conference experience!
```

**Contact Information Updated:**
```diff
- ICMBNT 2026 Organizing Committee
- KPR Institute of Technology, Coimbatore
- Email: icmbnt2026@kpriet.ac.in

+ ICMBNT 2026 Organizing Committee
+ Society for Cyber Intelligent Systems
+ Puducherry, India
+ Email: icmbnt2026@gmail.com
```

---

## Home Page Reference

**File:** `srm-front2/src/components/Home.tsx`

The following conference details are displayed on the home page:

```
Conference Dates: April 26 & 27, 2026
Location: Bali, Indonesia
Format: Hybrid Conference (In-person + Virtual)

Organized by:
- Society for Cyber Intelligent Systems (Puducherry, India)
- International Society of Intelligent Unmanned Systems (South Korea - Jimbaran Bali)
```

---

## Email Templates Aligned

✅ **Acceptance Email** - Now shows:
- Correct dates (April 26-27, 2026)
- Correct venue (Bali, Indonesia)
- Correct organizer info (Society for Cyber Intelligent Systems)
- Correct contact email (icmbnt2026@gmail.com)

✅ **Re-Review Email** - Uses:
- Dynamically calculated deadline (7 days from sending)
- Paper submission ID, title, and category
- Login link to reviewer dashboard

✅ **Reviewer Assignment Email** - Uses:
- Dynamic review deadline from assignment data
- Paper details from database
- Login credentials for reviewer

---

## Important Notes

1. **Consistency:** All emails now consistently reference:
   - April 26-27, 2026 as conference dates
   - Bali, Indonesia as venue
   - Society for Cyber Intelligent Systems as organizer
   - icmbnt2026@gmail.com as contact

2. **Hybrid Format:** Emails now mention that the conference is hybrid, allowing both in-person and virtual participation

3. **Registration Link:** All acceptance emails include the registration link: 
   `https://icmbnt2026-yovz.vercel.app/Registrations`

4. **Copyright Form:** Acceptance email includes PDF attachment of Copyright Form

---

## Testing Checklist

- [ ] Accept a paper as Editor
- [ ] Verify acceptance email contains:
  - ✅ Correct dates (April 26-27, 2026)
  - ✅ Correct venue (Bali, Indonesia)
  - ✅ Correct organizer (Society for Cyber Intelligent Systems)
  - ✅ Correct email (icmbnt2026@gmail.com)
  - ✅ Copyright Form PDF attached
  - ✅ Registration link working
  - ✅ Paper details (ID, title, author)

- [ ] Send re-review emails
- [ ] Verify re-review email contains:
  - ✅ Paper details (ID, title, category)
  - ✅ 7-day deadline calculated correctly
  - ✅ Login link to reviewer dashboard
  - ✅ Clear explanation of Review 2 task

---

## Deployment

**No additional deployment steps needed:**
- ✅ Backend syntax checked
- ✅ Frontend builds successfully
- ✅ Email templates are now consistent
- ✅ Ready for production

**Environment Variables (verify these are set):**
```bash
FRONTEND_URL=https://icmbnt2026-yovz.vercel.app
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

---

## Summary

✅ All emails now correctly reference:
- Conference dates: April 26-27, 2026
- Venue: Bali, Indonesia (Jimbaran)
- Organizer: Society for Cyber Intelligent Systems
- Contact: icmbnt2026@gmail.com
- Format: Hybrid (In-person + Virtual)

This ensures consistency across all communication to authors, reviewers, and editors.
