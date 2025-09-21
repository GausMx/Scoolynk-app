import bcrypt from 'bcrypt';
import crypto from 'crypto';
// Bulk register parents and children from Excel/CSV upload
export const bulkRegisterParents = async (req, res) => {
  try {
    const { users } = req.body; // [{ name, email, phone, role, ... }]
    const schoolId = req.user.schoolId;
    const createdUsers = [];
    const errors = [];
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users provided for bulk registration.' });
    }
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Validate required fields
      const missing = [];
      if (!user.name) missing.push('name');
      if (!user.email) missing.push('email');
      if (!user.phone) missing.push('phone');
      if (!user.role) missing.push('role');
      if (user.role === 'parent' && (!user.children || !Array.isArray(user.children) || user.children.length === 0)) {
        missing.push('children');
      }
      if (user.role === 'teacher' && (!user.classes || !Array.isArray(user.classes) || user.classes.length === 0)) {
        missing.push('classes');
      }
      if (missing.length > 0) {
        errors.push({ row: i + 2, msg: `Missing required fields: ${missing.join(', ')}` });
        continue;
      }
      // Check for duplicate
      let dbUser = await User.findOne({ email: user.email, schoolId });
      if (!dbUser) {
        // Generate temp password
        const tempPassword = crypto.randomBytes(4).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        dbUser = await User.create({
          name: user.name,
          email: user.email,
          phone: user.phone,
          passwordHash,
          role: user.role,
          schoolId,
          mustChangePassword: true,
        });
        // Log SMS/WhatsApp notification placeholder
        console.log(`[BulkRegister] Send to ${user.phone}: Your account has been created. Email: ${user.email}, Temp Password: ${tempPassword}`);
      }
      // Parent: create children
      if (user.role === 'parent' && Array.isArray(user.children)) {
        for (const childName of user.children) {
          if (!childName) continue;
          let child = await (await import('../models/Student.js')).default.findOne({ name: childName, parents: dbUser._id, schoolId });
          if (!child) {
            child = await (await import('../models/Student.js')).default.create({
              name: childName,
              schoolId,
              parents: [dbUser._id],
            });
            dbUser.children.push(child._id);
          }
        }
        await dbUser.save();
      }
      // Teacher: assign classes/courses
      if (user.role === 'teacher') {
        if (Array.isArray(user.classes)) {
          dbUser.classes = [];
          for (const className of user.classes) {
            if (!className) continue;
            // Find or create class for this school
            let dbClass = await (await import('../models/Class.js')).default.findOne({ name: className, schoolId });
            if (!dbClass) {
              dbClass = await (await import('../models/Class.js')).default.create({ name: className, schoolId, fee: 0 });
            }
            // Add teacher to class if not already
            if (!dbClass.teachers.includes(dbUser._id)) {
              dbClass.teachers.push(dbUser._id);
              await dbClass.save();
            }
            dbUser.classes.push(dbClass._id);
          }
        }
        if (Array.isArray(user.courses)) {
          dbUser.courses = user.courses;
        }
        await dbUser.save();
      }
      createdUsers.push(dbUser.email);
    }
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Some users could not be registered.', errors });
    }
    res.json({ message: `Bulk registration complete. Users created: ${createdUsers.length}` });
  } catch (err) {
    console.error('[BulkRegisterUsers]', err);
    res.status(500).json({ message: 'Bulk registration failed.', error: err.message });
  }
};
import Result from '../models/Result.js';
import User from '../models/User.js';

// Get all submitted results for admin's school
export const getSubmittedResults = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const results = await Result.find({ status: 'submitted' }).populate({
      path: 'student',
      match: { schoolId },
      populate: { path: 'classId', select: 'name' }
    }).populate('teacher', 'name');
    res.json({ results: results.filter(r => r.student) });
  } catch (err) {
    console.error('[AdminGetResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

// Verify or reject a result
export const reviewResult = async (req, res) => {
  try {
    const { resultId, action } = req.body; // action: 'verify' or 'reject'
    const result = await Result.findById(resultId).populate('student');
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    if (String(result.student.schoolId) !== String(req.user.schoolId)) {
      return res.status(403).json({ message: 'Not authorized for this school.' });
    }
    result.status = action === 'verify' ? 'verified' : 'rejected';
    await result.save();
    // TODO: Notify parent/teacher of verification/rejection
    res.json({ message: `Result ${action}ed.` });
  } catch (err) {
    console.error('[AdminReviewResult]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// Broadcast notification to all users in school
export const broadcastNotification = async (req, res) => {
  try {
    const { message } = req.body;
    const schoolId = req.user.schoolId;
    // Find all users in school
    const users = await User.find({ schoolId });
    // TODO: Actually send notification (email, dashboard, etc.)
    users.forEach(u => {
      console.log(`[Broadcast] To: ${u.email} | Message: ${message}`);
    });
    res.json({ message: 'Notification broadcasted.' });
  } catch (err) {
    console.error('[AdminBroadcast]', err);
    res.status(500).json({ message: 'Failed to broadcast notification.' });
  }
};
// server/controllers/adminController.js

// Placeholder for future admin-specific routes and logic

const getAdminDashboard = (req, res) => {
  res.json({ message: `Welcome to the Admin Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.` });
};

export { getAdminDashboard };
