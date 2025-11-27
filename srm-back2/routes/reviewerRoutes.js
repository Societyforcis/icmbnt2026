import express from 'express';
import {
    getAssignedPapers,
    getPaperForReview,
    submitReview,
    getReviewDraft,
    getReviewerDashboardStats
} from '../controllers/reviewerController.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireReviewer } from '../middleware/roleCheck.js';

const router = express.Router();

// All reviewer routes require authentication and reviewer role
router.use(verifyJWT, requireReviewer);

// Paper review
router.get('/papers', getAssignedPapers);
router.get('/papers/:submissionId', getPaperForReview);
router.get('/papers/:submissionId/draft', getReviewDraft);
router.post('/papers/:submissionId/submit-review', submitReview);

// Dashboard statistics
router.get('/dashboard-stats', getReviewerDashboardStats);

export default router;
