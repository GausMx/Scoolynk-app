import bcrypt from 'bcrypt';
import crypto from 'crypto';
          let childName, className, regNo;
          if (typeof childObj === 'string') {
            childName = childObj;
            className = user.className || null; // fallback to parent's className if provided
          } else if (typeof childObj === 'object') {
            childName = childObj.name;
            className = childObj.className;
            regNo = childObj.regNo;
          }
          if (!childName || !className) continue; // skip if missing
          // Find or create class for this school
          let dbClass = await (await import('../models/Class.js')).default.findOne({ name: className, schoolId });
          if (!dbClass) {
            dbClass = await (await import('../models/Class.js')).default.create({ name: className, schoolId, fee: 0 });
          }
          let child = await (await import('../models/Student.js')).default.findOne({ name: childName, parents: dbUser._id, schoolId });
          if (!child) {
            const studentData = {
              name: childName,
              classId: dbClass._id,
              schoolId,
              parents: [dbUser._id],
            };
            if (regNo) studentData.regNo = regNo;
            child = await (await import('../models/Student.js')).default.create(studentData);
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
