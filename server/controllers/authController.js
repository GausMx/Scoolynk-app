// @desc    Reset password for users with mustChangePassword
// @route   POST /api/auth/reset-password
// @access  Public (user must provide userId and new password)
const resetPassword = async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password || password.length < 6) {
    return res.status(400).json({ message: 'Invalid request.' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.passwordHash = await User.hashPassword(password);
    user.mustChangePassword = false;
    await user.save();
    // Return new token
    res.json({
      token: generateToken(user._id, user.schoolId, user.role),
      message: 'Password updated.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};
// server/controllers/authController.js

import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import School from '../models/School.js';
import mongoose from 'mongoose';

// Helper function to generate a JWT token
const generateToken = (id, schoolId, role) => {
  // The JWT secret and token expiry are from your environment variables.
  // This ensures your tokens are signed securely and expire correctly.
  return jwt.sign({ id, schoolId, role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, password, role, schoolName } = req.body;

  try {
    // Check for duplicate email or phone
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email or phone number already registered.' });
    }

    let school;
    let schoolId;

    // Logic for multi-tenancy: admin registration creates a new school
    if (role === 'admin') {
      if (!schoolName) {
        return res.status(400).json({ message: 'Admin registration requires a school name.' });
      }
      // Password is hashed with a salt of 10 for strong security.
      const passwordHash = await User.hashPassword(password);
      
      const tempUser = await User.create({
        name,
        email,
        phone,
        passwordHash,
        role,
        // The schoolId will be set after the school is created
        schoolId: new mongoose.Types.ObjectId(), 
        trialStartDate: new Date(),
      });

      // Create a new school document linked to the new admin user
      school = await School.create({
        name: schoolName,
        adminUserId: tempUser._id,
      });

      // Update the user with the new schoolId
      tempUser.schoolId = school._id;
      await tempUser.save();
      
      schoolId = school._id;

    } else {
      // Future-proofing: For other roles (teacher, parent),
      // their registration would likely be managed by an admin,
      // and they would be passed a schoolId or similar.
      // For now, we will require schoolId in the request body.
      return res.status(400).json({ message: 'Only admin can self-register at this time. Future registration for other roles will be via admin invitation.' });
    }

    // After creation, find the user to return
    const user = await User.findOne({ email }).select('-passwordHash');

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      schoolId: user.schoolId,
      token: generateToken(user._id, user.schoolId, user.role),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // Verify user and password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        mustChangePassword: user.mustChangePassword,
        token: generateToken(user._id, user.schoolId, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = (req, res) => {
  // The user object is attached to the request by the auth middleware
  // This ensures the route is protected and the user is authenticated
  res.json({ user: req.user });
};

export { register, login, getMe, resetPassword };
