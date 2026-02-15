import express from 'express';
import { check } from 'express-validator';
import {
  register,
  login,
  getMe,
  resetPassword,
  adminExists,
  refreshToken,
  logout,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Check if admin exists (frontend use)
router.get('/admin-exists', adminExists);

// Register
router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Valid email required').isEmail(),
    check('phone', 'Phone number required').notEmpty(),
    check('password', 'Password min 6 chars').isLength({ min: 6 }),
    check('role', 'Role required').isIn(['admin', 'teacher', 'parent']),
     // ✅ Conditional validation based on role
    check('schoolName')
      .if(check('role').equals('admin'))
      .notEmpty()
      .withMessage('School name is required for admin registration'),
    
    check('schoolCode')
      .if((value, { req }) => req.body.role === 'teacher' || req.body.role === 'parent')
      .notEmpty()
      .withMessage('School code is required for teacher/parent registration')
      .isLength({ min: 16, max: 16 })
      .withMessage('School code must be 16 characters'),
    
    check('studentRegNo')
      .if(check('role').equals('parent'))
      .notEmpty()
      .withMessage('Student registration number is required for parent registration'),
  
  ],
  register
);

// Login
router.post('/login', login);

// Refresh access token
router.post('/refresh', refreshToken);

// Logout
router.post('/logout', logout);

// Reset password
router.post('/reset-password', resetPassword);

// Get current user
router.get('/me', protect, getMe);

export default router;
