import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Result from '../models/Result.js';

// -------------------------
// Bulk register users
// -------------------------
export const bulkRegisterUsers = async (req, res) => {
  try {
    const { users, schoolId } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users provided.' });
    }

    const createdUsers = [];
    const errors = [];

    for (const user of users) {
      try {
        if (!user.email || !user.role || !user.password) {
          errors.push({ user, message: 'Missing email, role, or password.' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name || user.email.split('@')[0],
            email: user.email,
            password: hashedPassword,
            role: user.role,
            schoolId,
          });
        }

        // -------------------------
        // Parent logic: handle children
        // -------------------------
        if (user.role === 'parent' && Array.isArray(user.children)) {
          for (const childObj of user.children) {
            let childName, className, regNo;

            if (typeof childObj === 'string') {
              childName = childObj;
              className = user.className || null;
            } else if (typeof childObj === 'object') {
              childName = childObj.name;
              className = childObj.className;
              regNo = childObj.regNo;
            }

            if (!childName || !className) continue;

            let dbClass = await Class.findOne({ name: className, schoolId });
            if (!dbClass) {
              dbClass = await Class.create({ name: className, schoolId, fee: 0 });
            }

            let child = await Student.findOne({ name: childName, parents: dbUser._id, schoolId });
            if (!child) {
              const studentData = { name: childName, classId: dbClass._id, schoolId, parents: [dbUser._id] };
              if (regNo) studentData.regNo = regNo;
              child = await Student.create(studentData);
              dbUser.children.push(child._id);
            }
          }
        }

        // -------------------------
        // Teacher logic: handle classes and courses
        // -------------------------
        if (user.role === 'teacher') {
          if (Array.isArray(user.classes)) {
            dbUser.classes = [];
            for (const className of user.classes) {
              if (!className) continue;
              let dbClass = await Class.findOne({ name: className, schoolId });
              if (!dbClass) dbClass = await Class.create({ name: className, schoolId, fee: 0 });

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
        }

        await dbUser.save();
        createdUsers.push(dbUser.email);
      } catch (userErr) {
        errors.push({ user, message: userErr.message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Some users could not be registered.', errors });
    }

    res.json({ message: `Bulk registration complete. Users created: ${createdUsers.length}`, createdUsers });
  } catch (err) {
    console.error('[BulkRegisterUsers]', err);
    res.status(500).json({ message: 'Bulk registration failed.', error: err.message });
  }
};

// -------------------------
// Get all submitted results for admin's school
// -------------------------
export const getSubmittedResults = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const results = await Result.find({ status: 'submitted' })
      .populate({
        path: 'student',
        match: { schoolId },
        populate: { path: 'classId', select: 'name' }
      })
      .populate('teacher', 'name');

    res.json({ results: results.filter(r => r.student) });
  } catch (err) {
    console.error('[AdminGetResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

// -------------------------
// Verify or reject a result
// -------------------------
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
    res.json({ message: `Result ${action}ed.` });
  } catch (err) {
    console.error('[AdminReviewResult]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// -------------------------
// Broadcast notification to all users in school
// -------------------------
export const broadcastNotification = async (req, res) => {
  try {
    const { message } = req.body;
    const schoolId = req.user.schoolId;
    const users = await User.find({ schoolId });

    users.forEach(u => {
      console.log(`[Broadcast] To: ${u.email} | Message: ${message}`);
    });

    res.json({ message: 'Notification broadcasted.' });
  } catch (err) {
    console.error('[AdminBroadcast]', err);
    res.status(500).json({ message: 'Failed to broadcast notification.' });
  }
};

// -------------------------
// Admin dashboard
// -------------------------
export const getAdminDashboard = (req, res) => {
  res.json({
    message: `Welcome to the Admin Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.`
  });
};

// -------------------------
// Export all functions
// -------------------------