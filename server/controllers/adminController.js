import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js'; // assuming you have a School model
import Result from '../models/Result.js';

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
    const { resultId, action } = req.body;
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
// Update admin settings (password & school info)
// -------------------------
export const updateAdminSettings = async (req, res) => {
  try {
    const { newPassword, schoolName, schoolAddress } = req.body;
    const adminId = req.user._id;

    // Update admin password
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(adminId, { password: hashedPassword });
    }

    // Update school info
    if (schoolName || schoolAddress) {
      await School.findByIdAndUpdate(req.user.schoolId, {
        ...(schoolName && { name: schoolName }),
        ...(schoolAddress && { address: schoolAddress }),
      });
    }

    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error('[UpdateAdminSettings]', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};

// -------------------------
// Export all functions
// -------------------------

