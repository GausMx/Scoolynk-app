import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getSubmittedResults,
  reviewResult,
  broadcastNotification,
  getAdminSettings,
  updateAdminSettings
} from '../controllers/adminController.js';

const router = express.Router();

// Review submitted results
router.get('/results', protect, requireRole('admin'), getSubmittedResults);
router.post('/results/review', protect, requireRole('admin'), reviewResult);

// Broadcast notification
router.post('/broadcast', protect, requireRole('admin'), broadcastNotification);

// Settings
router.get('/settings', protect, requireRole('admin'), getAdminSettings);
router.post('/settings', protect, requireRole('admin'), updateAdminSettings);

export default router;
