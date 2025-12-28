// server/routes/paymentRoutes.js - FIXED VERSION

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  paymentInitLimiter,
  paymentVerifyLimiter
} from '../middleware/rateLimiter.js';
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

// ========== ADMIN ROUTES ==========
router.post('/create-link', protect, requireRole('admin'), createPaymentLink);
router.post('/send-link', protect, requireRole('admin'), sendPaymentLinkToParent);
router.post('/send-bulk', protect, requireRole('admin'), sendPaymentLinksToAll);
router.get('/history', protect, requireRole('admin'), getPaymentHistory);

// ========== PUBLIC ROUTES ==========

// ✅ NO RATE LIMIT on viewing payment page
router.get('/:token', getPaymentDetails);

// ✅ Rate limit ONLY on payment initialization (costs money)
router.post('/:token/initialize', paymentInitLimiter, initializePayment);

// ✅ Lenient rate limit on verification (just checking status)
router.get('/verify/:reference', paymentVerifyLimiter, verifyPayment);

export default router;