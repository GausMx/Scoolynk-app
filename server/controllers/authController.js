// server/controllers/authController.js - UPDATED WITH PARENT SUPPORT

import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import School from '../models/School.js';
import Student from '../models/Student.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Generate access token
const generateAccessToken = (id, schoolId, role) =>
  jwt.sign({ id, schoolId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '1h', // 1 hour
  });

// Generate refresh token
const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '30d', // 30 days
  });

// Helper: generate unique school code
const generateSchoolCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // Handle different Nigerian formats
  if (normalized.startsWith('234')) {
    // +234 or 234 format -> keep as is
    normalized = normalized;
  } else if (normalized.startsWith('0')) {
    // 0 prefix -> replace with 234
    normalized = '234' + normalized.slice(1);
  } else if (normalized.length === 10) {
    // 10 digits without prefix -> add 234
    normalized = '234' + normalized;
  }
  
  return normalized;
};
// ----------------------
// REGISTER - UPDATED WITH PHONE NORMALIZATION
// ----------------------
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[Registration Validation Error]', errors.array());
    return res.status(400).json({ 
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }

  const { 
    name, 
    email, 
    phone, 
    password, 
    role, 
    schoolName, 
    schoolCode, 
    classes, 
    courses,
    studentRegNo
  } = req.body;
  
  console.log('[Registration] Received data:', { 
    name, 
    email, 
    phone, 
    role, 
    schoolName: schoolName || 'N/A',
    schoolCode: schoolCode || 'N/A',
    studentRegNo: studentRegNo || 'N/A'
  });

  const normalizedEmail = email.toLowerCase();

  try {
    const userExists = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email or phone number already registered.' });
    }

    let school;
    let schoolId;

    // ========== ADMIN REGISTRATION ==========
    if (role === 'admin') {
      if (!schoolName) {
        return res.status(400).json({ message: 'Admin registration requires a school name.' });
      }

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
        phone,
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
    } 
    
    // ========== TEACHER REGISTRATION ==========
    else if (role === 'teacher') {
      if (!schoolCode || schoolCode.length !== 16) {
        return res.status(400).json({ message: 'A valid 16-digit school code is required.' });
      }

      school = await School.findOne({ schoolCode });
      if (!school) {
        return res.status(400).json({ message: 'Invalid school code.' });
      }

      schoolId = school._id;
      const passwordHash = await User.hashPassword(password);
      await User.create({
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        schoolId,
        classes: classes || [],
        courses: courses || [],
      });
    } 
    
    // ========== ✅ PARENT REGISTRATION (NEW) ==========
  else if (role === 'parent') {
      if (!schoolCode || schoolCode.length !== 16) {
        return res.status(400).json({ 
          message: 'A valid 16-digit school code is required for parent registration.' 
        });
      }

      if (!studentRegNo || !studentRegNo.trim()) {
        return res.status(400).json({ 
          message: 'Student registration number is required.' 
        });
      }

      // Find school
      school = await School.findOne({ schoolCode });
      if (!school) {
        return res.status(400).json({ message: 'Invalid school code.' });
      }

      // Find student by registration number
      const student = await Student.findOne({ 
        regNo: studentRegNo.trim(), 
        schoolId: school._id 
      });

      if (!student) {
        return res.status(400).json({ 
          message: 'No student found with this registration number in the specified school.' 
        });
      }

      // Check if student already has a parent account
      if (student.parentId) {
        return res.status(400).json({ 
          message: 'This student already has a parent account linked. Please contact the school admin.' 
        });
      }

      // ✅ UPDATED: Normalize both phone numbers before comparison
      const normalizedInputPhone = normalizePhoneNumber(phone);
      const normalizedStudentPhone = normalizePhoneNumber(student.parentPhone);

      console.log('[ParentRegistration] Phone comparison:', {
        inputPhone: phone,
        normalizedInput: normalizedInputPhone,
        studentPhone: student.parentPhone,
        normalizedStudent: normalizedStudentPhone
      });

      // Verify parent phone matches student's parent phone (optional security check)
      if (student.parentPhone && normalizedInputPhone !== normalizedStudentPhone) {
        return res.status(400).json({ 
          message: `Phone number does not match the student's parent phone on record. 
                   Registered: ${student.parentPhone}. 
                   Please contact the school if this is incorrect.` 
        });
      }

      schoolId = school._id;
      const passwordHash = await User.hashPassword(password);
      
      // Create parent user
      const parentUser = await User.create({
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role: 'parent',
        schoolId,
        children: [student._id],
      });

      // Update student to link parent
      student.parentId = parentUser._id;
      await student.save();

      console.log(`[ParentRegistration] Parent ${name} linked to student ${student.name} (${student.regNo})`);
    } 
    
    else {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('-passwordHash');

    const accessToken = generateAccessToken(user._id, user.schoolId, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      schoolId: user.schoolId,
      needsOnboarding: role === 'teacher',
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('[Registration Error]', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ----------------------
// LOGIN - SAME (supports all roles)
// ----------------------
const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id, user.schoolId, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      mustChangePassword: user.mustChangePassword,
      accessToken,
      refreshToken,
      rememberMe: rememberMe || false,
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------
// REFRESH TOKEN
// ----------------------
const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        console.error('[RefreshToken] Token verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return res.status(404).json({ message: 'User not found' });

      const newAccessToken = generateAccessToken(user._id, user.schoolId, user.role);
      
      console.log('[RefreshToken] Token refreshed for user:', user.email);
      
      res.json({ 
        accessToken: newAccessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId
        }
      });
    });
  } catch (error) {
    console.error('[Refresh Token Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------
// LOGOUT
// ----------------------
const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// ----------------------
// GET CURRENT USER
// ----------------------
const getMe = (req, res) => {
  res.json({ user: req.user });
};

// ----------------------
// CHECK ADMIN EXISTS
// ----------------------
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

// ----------------------
// RESET PASSWORD
// ----------------------
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

    const accessToken = generateAccessToken(user._id, user.schoolId, user.role);
    res.json({ accessToken, message: 'Password updated.' });
  } catch (err) {
    console.error('[ResetPassword Error]', err);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};

export { register, login, getMe, resetPassword, adminExists, refreshToken, logout };