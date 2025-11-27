import express from 'express';
import {
    verifyEditorAccess,
    getAssignedPapers,
    createReviewer,
    getAllReviewers,
    assignReviewers,
    getPaperReviews,
    makeFinalDecision,
    getEditorDashboardStats,
    getAllPapers,
    getPdfBase64,
    getReviewerDetails,
    sendMessage,
    getMessageThread,
    getPaperMessages,
    getAllMessages,
    getNonRespondingReviewers,
    sendReviewerReminder,
    sendBulkReminders,
    getAllPdfs,
    deletePdf
} from '../controllers/editorController.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireEditor } from '../middleware/roleCheck.js';

const router = express.Router();

// All editor routes require authentication and editor role
router.use(verifyJWT, requireEditor);

// Verify editor access
router.get('/verify-access', verifyEditorAccess);

// Paper management
router.get('/papers', getAllPapers);              // Get ALL papers (not just assigned)
router.get('/pdf/:submissionId', getPdfBase64);  // Get PDF as base64
router.get('/papers/:paperId/reviews', getPaperReviews);

// Reviewer management
router.post('/reviewers', createReviewer);
router.get('/reviewers', getAllReviewers);
router.post('/assign-reviewers', assignReviewers);

// Reviewer details and messaging
router.get('/review/:reviewId', getReviewerDetails);
router.get('/messages', getAllMessages);
router.get('/papers/:paperId/messages', getPaperMessages);
router.get('/messages/:submissionId/:reviewId', getMessageThread);
router.post('/send-message', sendMessage);

// Decision making
router.post('/make-decision', makeFinalDecision);

// Reviewer reminders
router.get('/non-responding-reviewers', getNonRespondingReviewers);
router.post('/send-reminder', sendReviewerReminder);
router.post('/send-bulk-reminders', sendBulkReminders);

// PDF Management
router.get('/pdfs', getAllPdfs);          // Get all PDFs from Cloudinary
router.delete('/pdfs', deletePdf);        // Delete PDF from Cloudinary

// Dashboard statistics
router.get('/dashboard-stats', getEditorDashboardStats);

export default router;
