import { getParentDashboard } from '../controllers/parentController.js';

// Dashboard route: GET /parent/children
router.get('/children', protect, requireRole('parent'), getParentDashboard);
import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import parentController from '../controllers/parentController.js';

const router = express.Router();

// Example: Only parent of the same school can access
router.get('/dashboard', protect, requireRole('parent'), parentController.dashboard);

// Add more parent routes here, always use protect and requireRole('parent')

export default router;
