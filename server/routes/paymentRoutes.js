// server/routes/paymentRoutes.js - WITH RATE LIMITING

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  publicPaymentLimiter,
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

// ========== ADMIN ROUTES (PROTECTED) ==========
router.post('/create-link', protect, requireRole('admin'), createPaymentLink);
router.post('/send-link', protect, requireRole('admin'), sendPaymentLinkToParent);
router.post('/send-bulk', protect, requireRole('admin'), sendPaymentLinksToAll);
router.get('/history', protect, requireRole('admin'), getPaymentHistory);

// ========== PUBLIC ROUTES (NO AUTH) WITH RATE LIMITING ==========

// ✅ Get payment details - Rate limited (10 requests per 15 min per IP)
router.get(
  '/:token', 
  publicPaymentLimiter,
  getPaymentDetails
);

// ✅ Initialize payment - Stricter rate limit (3 requests per 5 min per token+IP)
router.post(
  '/:token/initialize', 
  paymentInitLimiter,
  initializePayment
);

// ✅ Verify payment - More generous limit (20 requests per min)
router.get(
  '/verify/:reference', 
  paymentVerifyLimiter,
  verifyPayment
);

export default router;