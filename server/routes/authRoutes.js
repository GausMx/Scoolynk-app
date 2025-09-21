// server/routes/authRoutes.js

import express from 'express';
import { check } from 'express-validator';
import { register, login, getMe, resetPassword } from '../controllers/authController.js';
// Password reset for users with mustChangePassword
router.post('/reset-password', resetPassword);
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    // Input validation ensures data integrity and security
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['admin', 'teacher', 'parent']),
  ],
  register
);

router.post('/login', login);

// This route is protected by both authentication and subscription middleware
router.get('/me', protect, getMe);

export default router;
