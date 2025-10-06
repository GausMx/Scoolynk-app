import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import subscriptionGuard from '../middleware/subscriptionMiddleware.js'; // Import subscriptionGuard
import {
  getSubmittedResults,
  reviewResult,
  broadcastNotification,
  getAdminSettings,
  updateAdminSettings,
  getAdminDashboard // Import the dashboard controller
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard (Mounted at /api/admin)
router.get('/', protect, subscriptionGuard, requireRole('admin'), getAdminDashboard);

// Review submitted results
router.get('/results', protect, requireRole('admin'), getSubmittedResults);
router.post('/results/review', protect, requireRole('admin'), reviewResult);

// Broadcast notification
router.post('/broadcast', protect, requireRole('admin'), broadcastNotification);

// Settings
router.get('/settings', protect, requireRole('admin'), getAdminSettings);
router.put('/settings', protect, requireRole('admin'), updateAdminSettings); // Changed to PUT for updateAdminSettings

export default router;
