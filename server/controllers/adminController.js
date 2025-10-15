import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js';
import Result from '../models/Result.js';
import Class from '../models/Class.js';

// -------------------------
// Get all submitted results for admin's school
// -------------------------
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.user.schoolId }).sort({createdAt: -1 });
    res.json({ classes });
  }
  catch (err) {
    console.error('[AdminGetClasses]', err);
    res.status(500).json({ message: 'Failed to fetch classes.' });
  } 
};

// POST /api/classes - Create new class (no teacher dependency)
export const createClass = async (req, res) => {
  try {
    const { name, fee} = req.body;  
    if (!name) return res.status(400).json({ message: 'Class name is required.' });
    if (fee == null || isNaN(fee) || fee < 0) return res.status(400).json({ message: 'Valid class fee is required.' });
    const newClass = new Class({ name, fee, schoolId: req.user.schoolId });
    await newClass.save();
    res.status(201).json({ message: 'Class created successfully.', class: newClass });
  } catch (err) {
    console.error('[CreateClass]', err);
    res.status(500).json({ message: 'Failed to create class.' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, fee} = req.body;
    const cls = await Class.findOne(
      { _id: id, schoolId: req.user.schoolId},
      {name, fee},
      {new: true}
    );
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    if (name) cls.name = name;
    if (fee != null && !isNaN(fee) && fee >= 0) cls.fee = fee;
    await cls.save();
    res.json({ message: 'Class updated successfully.', class: cls });
  } catch (err) { 
    console.error('[UpdateClass]', err);
    res.status(500).json({ message: 'Failed to update class.' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const {id} = req.params;
    const cls = await Class.findOneAndDelete({ _id: id, schoolId: req.user.schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json({ message: 'Class deleted successfully.' });
  } catch (err) {
    console.error('[DeleteClass]', err);
    res.status(500).json({ message: 'Failed to delete class.' });
  }
};

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
// Admin dashboard
// -------------------------
export const getAdminDashboard = (req, res) => {
  res.json({
    message: `Welcome to the Admin Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.`
  });
};

// GET /api/school/code
// Returns the school code for the currently logged-in admin
export const getSchoolCode = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found.' });
    res.json({ schoolCode: school.schoolCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------------------------
// Get Admin Settings (Fetches all pre-registered data + other settings)
// -------------------------
export const getAdminSettings = async (req, res) => {
  try {
    const adminId = req.user._id;
    console.log('[GetAdminSettings] Admin ID:', adminId);
    console.log('[GetAdminSettings] School ID:', req.user.schoolId);
    
    // Fetch Admin details
    const admin = await User.findById(adminId).select('-password');
    console.log('[GetAdminSettings] Admin found:', !!admin);
    if (admin) {
      console.log('[GetAdminSettings] Admin data:', { name: admin.name, email: admin.email });
    }
    
    // Fetch School details
    const school = await School.findById(req.user.schoolId).select(
      'name address phone motto classes subjects gradingSystem termStart termEnd defaultFee lateFee schoolCode'
    );
    console.log('[GetAdminSettings] School found:', !!school);
    if (school) {
      console.log('[GetAdminSettings] School data:', {
        name: school.name,
        address: school.address,
        phone: school.phone,
        motto: school.motto,
        schoolCode: school.schoolCode
      });
    }

    if (!admin || !school) {
      console.error('[GetAdminSettings] Missing data - admin:', !!admin, 'school:', !!school);
      return res.status(404).json({ message: 'Settings not found.' });
    }

    const responseData = {
      admin: {
        name: admin.name,
        email: admin.email,
      },
      school: {
        name: school.name,
        address: school.address,
        phone: school.phone,
        motto: school.motto,
        schoolCode: school.schoolCode,
        defaultFee: school.defaultFee,
        lateFee: school.lateFee,
        classes: school.classes,
        subjects: school.subjects,
        gradingSystem: school.gradingSystem,
        termStart: school.termStart ? new Date(school.termStart).toISOString().split('T')[0] : '',
        termEnd: school.termEnd ? new Date(school.termEnd).toISOString().split('T')[0] : '',
      },
    };
    
    console.log('[GetAdminSettings] Sending response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (err) {
    console.error('[GetAdminSettings] Error:', err);
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
