// server/routes/parentRoutes.js

import express from 'express';
import protect     from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

import {
  getParentDashboard,
  getMyChildren,
  getChildResults,
  getResultDetails,
  getPerformanceAnalytics,
} from '../controllers/parentController.js';

const router = express.Router();
const parent = [protect, requireRole('parent')];

router.get('/dashboard',                          ...parent, getParentDashboard);
router.get('/children',                           ...parent, getMyChildren);
router.get('/children/:studentId/results',        ...parent, getChildResults);
router.get('/results/:resultId',                  ...parent, getResultDetails);
router.get('/children/:studentId/analytics',      ...parent, getPerformanceAnalytics);

export default router;