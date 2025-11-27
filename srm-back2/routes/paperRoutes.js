import express from 'express';
import {
    submitPaper,
    getUserSubmission,
    getPaperStatus,
    editSubmission,
    getAllPapers,
    getPaperById
} from '../controllers/paperController.js';
import { verifyJWT } from '../middleware/auth.js';
import { uploadPaperPDF } from '../middleware/upload.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Author routes
router.post('/submit', verifyJWT, uploadPaperPDF.single('pdf'), submitPaper);
router.get('/my-submission', verifyJWT, getUserSubmission);
router.put('/edit/:submissionId', verifyJWT, uploadPaperPDF.single('pdf'), editSubmission);

// Public/semi-public routes
router.get('/status/:submissionId', getPaperStatus);

// Admin/Editor routes
router.get('/all', verifyJWT, requireRole('Admin', 'Editor'), getAllPapers);
router.get('/:id', verifyJWT, requireRole('Admin', 'Editor', 'Reviewer'), getPaperById);

export default router;
