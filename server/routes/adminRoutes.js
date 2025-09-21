import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { getSubmittedResults, reviewResult, broadcastNotification, bulkRegisterParents } from '../controllers/adminController.js';

const router = express.Router();

// Bulk register parents
router.post('/bulk-register', protect, requireRole('admin'), bulkRegisterParents);

// Review submitted results
router.get('/results', protect, requireRole('admin'), getSubmittedResults);
router.post('/results/review', protect, requireRole('admin'), reviewResult);

// Broadcast notification
router.post('/broadcast', protect, requireRole('admin'), broadcastNotification);

export default router;
