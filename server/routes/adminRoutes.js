import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { getSubmittedResults, reviewResult, broadcastNotification, updateAdminSettings } from '../controllers/adminController.js';

const router = express.Router();


// Review submitted results
router.get('/results', protect, requireRole('admin'), getSubmittedResults);
router.post('/results/review', protect, requireRole('admin'), reviewResult);

// Broadcast notification
router.post('/broadcast', protect, requireRole('admin'), broadcastNotification);
//settings
router.put('/settings', protect, requireRole('admin'), updateAdminSettings);


export default router;
