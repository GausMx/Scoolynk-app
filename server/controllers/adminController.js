import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js';
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
// Get Admin Settings (Fetches all pre-registered data + other settings)
// -------------------------
export const getAdminSettings = async (req, res) => {
  try {
    const adminId = req.user._id;
    // Fetch Admin details (for email)
    const admin = await User.findById(adminId).select('-password');
    
    // Fetch School details (for name, address, phone, motto, etc.)
    const school = await School.findById(req.user.schoolId).select(
      'name address phone motto classes subjects gradingSystem termStart termEnd defaultFee lateFee schoolCode'
    );

    if (!admin || !school) return res.status(404).json({ message: 'Settings not found.' });

    // --- DIAGNOSTIC LOGGING ---
    // Check your server console for this output to confirm what data is being retrieved
    // from the database before being sent to the client.
    console.log('Sending settings data:', {
      admin: { name: admin.name, email: admin.email },
      school: school.toObject() // Use .toObject() to log plain data
    });
    // --------------------------

    // Respond with combined data structure matching the frontend state setup
    res.json({
      admin: {
        name: admin.name,
        email: admin.email, // Admin's registered email (for schoolEmail field)
      },
      school: {
        name: school.name, // Registered school name (for schoolName field)
        address: school.address, // Registered school address
        phone: school.phone, // Registered school phone
        motto: school.motto, // Motto (may be null/empty initially)
        schoolCode: school.schoolCode,
        defaultFee: school.defaultFee,
        lateFee: school.lateFee,
        classes: school.classes,
        subjects: school.subjects,
        gradingSystem: school.gradingSystem,
        // Convert Date objects to YYYY-MM-DD string format for HTML date input
        termStart: school.termStart ? new Date(school.termStart).toISOString().split('T')[0] : '',
        termEnd: school.termEnd ? new Date(school.termEnd).toISOString().split('T')[0] : '',
      },
    });
  } catch (err) {
    console.error('[GetAdminSettings]', err);
    res.status(500).json({ message: 'Failed to load settings.' });
  }
};

// -------------------------
// Update Admin Settings (handles updates for profile, security, fees, academic)
// -------------------------
export const updateAdminSettings = async (req, res) => {
  try {
    // Frontend sends { section: 'profile', data: { schoolName: '...', ... } }
    const { section, data } = req.body;
    const adminId = req.user._id;
    const schoolId = req.user.schoolId;

    if (!section || !data) {
        return res.status(400).json({ message: 'Missing section or data in request body.' });
    }

    switch (section) {
      case 'profile': {
        const { schoolName, phone, address, motto } = data;
        await School.findByIdAndUpdate(schoolId, {
          name: schoolName,
          phone: phone,
          address: address,
          motto: motto,
        }, { new: true });
        return res.json({ message: 'School profile updated successfully.' });
      }

      case 'security': {
        const { currentPassword, newPassword, confirmPassword } = data;
        if (!currentPassword || !newPassword || !confirmPassword) {
             return res.status(400).json({ message: 'All password fields are required.' });
        }
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: 'New passwords do not match.' });
        }

        const admin = await User.findById(adminId).select('+password'); // Select password field
        if (!admin) return res.status(404).json({ message: 'Admin user not found.' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Current password is incorrect.' });
        }
        
        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(adminId, { password: hashedPassword });

        return res.json({ message: 'Password updated successfully.' });
      }

      case 'fees': {
        const { defaultFee, lateFee } = data;
        await School.findByIdAndUpdate(schoolId, {
          defaultFee: defaultFee,
          lateFee: lateFee,
        }, { new: true });
        return res.json({ message: 'Fee settings updated successfully.' });
      }
        
      case 'academic': {
        // NOTE: This currently only handles simple fields. 
        // We need to update this logic later to handle the classes/subjects arrays.
        const { gradingSystem, termStart, termEnd } = data;
        await School.findByIdAndUpdate(schoolId, {
          gradingSystem: gradingSystem,
          // Convert string dates back to Date objects
          termStart: termStart ? new Date(termStart) : null,
          termEnd: termEnd ? new Date(termEnd) : null,
        }, { new: true });
        return res.json({ message: 'Academic settings updated successfully.' });
      }
      
      default:
        return res.status(400).json({ message: 'Invalid settings section provided.' });
    }

  } catch (err) {
    console.error('[UpdateAdminSettings]', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};
