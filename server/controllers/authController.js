// server/controllers/authController.js

import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import School from '../models/School.js';
import mongoose from 'mongoose';
import Student from '../models/Student.js';

// Helper function to generate a JWT token
const generateToken = (id, schoolId, role) => {
  // The JWT secret and token expiry are from your environment variables.
  // This ensures your tokens are signed securely and expire correctly.
  return jwt.sign({ id, schoolId, role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Helper function to generate unique school code
const generateSchoolCode = () => {
  // Generates a 16-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

  const { name, email, phone, password, role, schoolName, schoolCode, children, classes, courses } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    // Check for duplicate email or phone
    const userExists = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email or phone number already registered.' });
    }

    let school;
    let schoolId;

    if (role === 'admin') {
      if (!schoolName) {
        return res.status(400).json({ message: 'Admin registration requires a school name.' });
      }
      
      const passwordHash = await User.hashPassword(password);
      
      // Create temporary user first
      const tempUser = await User.create({
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        schoolId: new mongoose.Types.ObjectId(),
        trialStartDate: new Date(),
      });
      
      // Create school with ALL fields initialized
      // Fields from registration form: name, phone (from admin)
      // Fields initialized empty: address, motto, fees, academic settings
      school = await School.create({
        name: schoolName,                  // FROM REGISTRATION FORM
        adminUserId: tempUser._id,
        schoolCode: generateSchoolCode(),  // AUTO-GENERATED
        phone: phone,                      // FROM REGISTRATION (admin's phone)
        
        // INITIALIZED EMPTY - Admin sets these in Settings page
        address: '',                       
        motto: '',                         
        defaultFee: 0,                     
        lateFee: 0,                        
        classes: [],                       
        subjects: [],                      
        gradingSystem: '',                 
        termStart: null,                   
        termEnd: null,                     
      });
      
      // Update user with actual school ID
      tempUser.schoolId = school._id;
      await tempUser.save();
      schoolId = school._id;
      
    } else if (role === 'teacher') {
      if (!schoolCode || schoolCode.length !== 16) {
        return res.status(400).json({ message: 'A valid 16-digit school code is required.' });
      }
      
      school = await School.findOne({ schoolCode });
      if (!school) {
        return res.status(400).json({ message: 'Invalid school code.' });
      }
      
      schoolId = school._id;
      
      // Validate required fields for teacher/parent
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
      

      
      const passwordHash = await User.hashPassword(password);
      await User.create({
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        schoolId,
        ...(role === 'teacher' ? { classes, courses } : {})
      });
      
    } else {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    // After creation, find the user to return
    const user = await User.findOne({ email: normalizedEmail }).select('-passwordHash');

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
    console.error('[Registration Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });

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
    console.error('[Login Error]', error);
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

// @desc    Check if an admin user already exists for a school
// @route   GET /api/auth/admin-exists?schoolName=...
// @access  Public
const adminExists = async (req, res) => {
  try {
    const { schoolName } = req.query;
    if (!schoolName) return res.status(400).json({ exists: false, error: 'Missing schoolName' });
    
    // Find school by name
    const school = await School.findOne({ name: schoolName });
    if (!school) return res.json({ exists: false });
    
    // Check if an admin exists for this school
    const admin = await User.findOne({ role: 'admin', schoolId: school._id });
    res.json({ exists: !!admin });
  } catch (err) {
    console.error('[AdminExists Error]', err);
    res.status(500).json({ exists: false });
  }
};

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
    console.error('[ResetPassword Error]', err);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};

export { register, login, getMe, resetPassword, adminExists };