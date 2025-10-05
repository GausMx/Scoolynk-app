import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js';
import Result from '../models/Result.js';

// -------------------------
// Get admin settings (Profile, Fees, Academic, etc.)
// -------------------------
export const getAdminSettings = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId).lean();
    const user = await User.findById(req.user._id).lean();

    if (!school || !user) {
      return res.status(404).json({ message: 'School or user not found.' });
    }

    res.json({
      schoolName: school.name,
      schoolEmail: user.email,
      phone: school.phone || '',
      address: school.address || '',
      motto: school.motto || '',
      defaultFee: school.defaultFee || '',
      lateFee: school.lateFee || '',
      classes: school.classes || [],
      subjects: school.subjects || [],
      gradingSystem: school.gradingSystem || '',
      termStart: school.termStart || '',
      termEnd: school.termEnd || '',
    });
  } catch (err) {
    console.error('[GetAdminSettings]', err);
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
};

// -------------------------
// Update admin settings based on section
// -------------------------
export const updateAdminSettings = async (req, res) => {
  try {
    const { section, data } = req.body;
    const adminId = req.user._id;
    const schoolId = req.user.schoolId;

    if (!section || !data) {
      return res.status(400).json({ message: 'Invalid request payload.' });
    }

    if (section === 'profile') {
      const { schoolName, schoolEmail, phone, address, motto } = data;

      await School.findByIdAndUpdate(schoolId, {
        ...(schoolName && { name: schoolName }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(motto && { motto }),
      });

      if (schoolEmail) {
        await User.findByIdAndUpdate(adminId, { email: schoolEmail });
      }

      return res.json({ message: 'Profile updated successfully.' });
    }

    if (section === 'security') {
      const { currentPassword, newPassword, confirmPassword } = data;
      const user = await User.findById(adminId);

      if (!user) return res.status(404).json({ message: 'User not found.' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect current password.' });
      if (newPassword !== confirmPassword)
        return res.status(400).json({ message: 'Passwords do not match.' });

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      await user.save();
      return res.json({ message: 'Password changed successfully.' });
    }

    if (section === 'fees') {
      const { defaultFee, lateFee } = data;
      await School.findByIdAndUpdate(schoolId, {
        ...(defaultFee && { defaultFee }),
        ...(lateFee && { lateFee }),
      });
      return res.json({ message: 'Fees updated successfully.' });
    }

    if (section === 'academic') {
      const { classes, subjects, gradingSystem, termStart, termEnd } = data;
      await School.findByIdAndUpdate(schoolId, {
        ...(classes && { classes }),
        ...(subjects && { subjects }),
        ...(gradingSystem && { gradingSystem }),
        ...(termStart && { termStart }),
        ...(termEnd && { termEnd }),
      });
      return res.json({ message: 'Academic settings updated successfully.' });
    }

    res.status(400).json({ message: 'Invalid section provided.' });
  } catch (err) {
    console.error('[UpdateAdminSettings]', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};
