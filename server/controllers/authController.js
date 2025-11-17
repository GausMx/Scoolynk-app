import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import School from '../models/School.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Generate access token
const generateAccessToken = (id, schoolId, role) =>
  jwt.sign({ id, schoolId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  });

// Generate refresh token
const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  });

// Helper: generate unique school code
const generateSchoolCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ----------------------
// REGISTER
// ----------------------
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, phone, password, role, schoolName, schoolCode, classes, courses } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    const userExists = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    if (userExists) return res.status(400).json({ message: 'Email or phone number already registered.' });

    let school;
    let schoolId;

    if (role === 'admin') {
      if (!schoolName) return res.status(400).json({ message: 'Admin registration requires a school name.' });

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

    } else if (role === 'teacher') {
      if (!schoolCode || schoolCode.length !== 16) return res.status(400).json({ message: 'A valid 16-digit school code is required.' });

      school = await School.findOne({ schoolCode });
      if (!school) return res.status(400).json({ message: 'Invalid school code.' });

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
    } else {
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
// LOGIN
// ----------------------
const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });

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
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });

      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const newAccessToken = generateAccessToken(user._id, user.schoolId, user.role);
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error('[Refresh Token Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------
// LOGOUT (OPTIONAL: if storing refresh in DB)
// ----------------------
const logout = async (req, res) => {
  // If refresh tokens stored in DB, remove it here
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
  if (!userId || !password || password.length < 6) return res.status(400).json({ message: 'Invalid request.' });

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
