// server/routes/parentRoutes.js - NEW FILE

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getParentDashboard,
  getMyChildren,
  getChildResults,
  getResultDetails,
  getPerformanceAnalytics
} from '../controllers/parentController.js';

const router = express.Router();

// All routes require authentication and parent role
router.use(protect, requireRole('parent'));

// Dashboard
router.get('/dashboard', getParentDashboard);

// Children management
router.get('/children', getMyChildren);
router.get('/children/:studentId/results', getChildResults);
router.get('/children/:studentId/analytics', getPerformanceAnalytics);

// Result details
router.get('/results/:resultId', getResultDetails);

export default router;