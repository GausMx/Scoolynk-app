
import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { getParentDashboard } from '../controllers/parentController.js';

const router = express.Router();

// Dashboard route: GET /parent/children
router.get('/children', protect, requireRole('parent'), getParentDashboard);

// Add more parent routes here, always use protect and requireRole('parent')

export default router;
