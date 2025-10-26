// server/routes/paymentRoutes.js - NEW FILE

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  createPaymentLink,
  sendPaymentLinkToParent,
  sendPaymentLinksToAll,
  getPaymentDetails,
  initializePayment,
  verifyPayment,
  getPaymentHistory
} from '../controllers/paymentController.js';

const router = express.Router();

// Admin routes (protected)
router.post('/create-link', protect, requireRole('admin'), createPaymentLink);
router.post('/send-link', protect, requireRole('admin'), sendPaymentLinkToParent);
router.post('/send-bulk', protect, requireRole('admin'), sendPaymentLinksToAll);
router.get('/history', protect, requireRole('admin'), getPaymentHistory);

// Public routes (for payment page)
router.get('/:token', getPaymentDetails);
router.post('/:token/initialize', initializePayment);
router.get('/verify/:reference', verifyPayment);

export default router;