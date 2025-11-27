import express from 'express';
import {
    createEditor,
    getAllEditors,
    assignEditor,
    reassignEditor,
    getAllUsers,
    getDashboardStats,
    deleteUser
} from '../controllers/adminController.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyJWT, requireAdmin);

// Editor management
router.post('/editors', createEditor);
router.get('/editors', getAllEditors);

// Paper assignment
router.post('/assign-editor', assignEditor);
router.post('/reassign-editor', reassignEditor);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

export default router;
