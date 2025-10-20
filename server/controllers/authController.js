// server/controllers/authController.js

import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import School from '../models/School.js';
import mongoose from 'mongoose';

// Helper function to generate a JWT token
const generateToken = (id, schoolId, role) => {
  return jwt.sign({ id, schoolId, role }, process.env.JWT_SECRET, {
    expiresIn: '24h', // Increased for testing - change back to '1h' in production
  });
};

// Helper function to generate unique school code
const generateSchoolCode = () => {
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
  console.log('[Register] Request received:', { role: req.body.role, email: req.body.email });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[Register] Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, password, role, schoolName, schoolCode, classes, courses } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    // Check for duplicate email or phone
    const userExists = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    if (userExists) {
      console.log('[Register] User already exists:', normalizedEmail);
      return res.status(400).json({ message: 'Email or phone number already registered.' });
    }

    let school;
    let schoolId;

    if (role === 'admin') {
      if (!schoolName) {
        return res.status(400).json({ message: 'Admin registration requires a school name.' });
      }
      
      console.log('[Register] Creating admin for school:', schoolName);
      const passwordHash = await User.hashPassword(password);
      
      const tempUser = await User.create({
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        schoolId: new mongoose.Types.ObjectId(),
        trialStartDate: new Date(),
      });
      
      school = await School.create({
        name: schoolName,
        adminUserId: tempUser._id,
        schoolCode: generateSchoolCode(),
        phone: phone,
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
      
      tempUser.schoolId = school._id;
      await tempUser.save();
      schoolId = school._id;
      console.log('[Register] Admin created successfully');
      
    } else if (role === 'teacher') {
      if (!schoolCode || schoolCode.length !== 16) {
        return res.status(400).json({ message: 'A valid 16-digit school code is required.' });
      }
      
      console.log('[Register] Finding school with code:', schoolCode);
      school = await School.findOne({ schoolCode });
      if (!school) {
        console.log('[Register] School not found for code:', schoolCode);
        return res.status(400).json({ message: 'Invalid school code.' });
      }
      
      schoolId = school._id;
      console.log('[Register] School found:', school.name);
      
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      console.log('[Register] Creating teacher with classes:', classes?.length, 'courses:', courses?.length);
      
      // MODIFIED: Store classes and courses as ObjectIds/Strings (already validated from frontend)
      const passwordHash = await User.hashPassword(password);
      await User.create({
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        schoolId,
        classes: classes || [], // Array of Class ObjectIds
        courses: courses || []  // Array of course names (strings)
      });
      
      console.log('[Register] Teacher created successfully');
      
    } else {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('-passwordHash');
    console.log('[Register] Returning user data with needsOnboarding:', role === 'teacher');

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      schoolId: user.schoolId,
      needsOnboarding: role === 'teacher', // NEW: Flag to redirect to onboarding
      token: generateToken(user._id, user.schoolId, user.role),
    });

  } catch (error) {
    console.error('[Registration Error]', error);
    console.error('[Registration Error Stack]', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
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
  res.json({ user: req.user });
};

// @desc    Check if an admin user already exists for a school
// @route   GET /api/auth/admin-exists?schoolName=...
// @access  Public
const adminExists = async (req, res) => {
  try {
    const { schoolName } = req.query;
    if (!schoolName) return res.status(400).json({ exists: false, error: 'Missing schoolName' });
    
    const school = await School.findOne({ name: schoolName });
    if (!school) return res.json({ exists: false });
    
    const admin = await User.findOne({ role: 'admin', schoolId: school._id });
    res.json({ exists: !!admin });
  } catch (err) {
    console.error('[AdminExists Error]', err);
    res.status(500).json({ exists: false });
  }
};

// @desc    Reset password for users with mustChangePassword
// @route   POST /api/auth/reset-password
// @access  Public
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