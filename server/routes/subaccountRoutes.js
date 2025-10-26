import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getBankList,
  verifyBankAccount,
  createSubaccount,
  getPaymentConfig,
  updateSubaccount
} from '../controllers/subaccountController.js';

const router = express.Router();

router.get('/banks', protect, requireRole('admin'), getBankList);
router.post('/verify-account', protect, requireRole('admin'), verifyBankAccount);
router.post('/create', protect, requireRole('admin'), createSubaccount);
router.get('/config', protect, requireRole('admin'), getPaymentConfig);
router.put('/update', protect, requireRole('admin'), updateSubaccount);

export default router;