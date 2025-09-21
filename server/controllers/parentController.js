// Get parent dashboard: children, results, fees, notifications
export const getParentDashboard = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    // Only fetch parent and children for this school
    const parent = await User.findOne({ _id: req.user._id, schoolId }).populate({
      path: 'children',
      match: { schoolId },
      populate: [
        { path: 'classId', select: 'name schoolId', match: { schoolId } }
      ]
    });
    if (!parent) {
      console.error(`[ParentDashboard] Parent not found or not in school: ${req.user._id}, school: ${schoolId}`);
      return res.status(404).json({ message: 'Parent not found.' });
    }
    // For each child, fetch results and fees, filter by schoolId
    const children = await Promise.all((parent.children || []).map(async (child) => {
      if (!child.classId || String(child.classId.schoolId) !== String(schoolId)) return null;
      // Results
      const results = await (await import('../models/Result.js')).default.find({ student: child._id, classId: child.classId._id });
      // Fees
      const fees = await (await import('../models/studentPayment.js')).default.findOne({ student: child._id, classId: child.classId._id });
      // Notification: result published or fee due
      const childNotifications = [];
      if (results.some(r => r.status === 'verified')) childNotifications.push({ message: `New result published for ${child.name}` });
      if (fees && fees.status === 'pending') childNotifications.push({ message: `School fee pending for ${child.name}` });
      return {
        ...child.toObject(),
        results,
        fees,
        notifications: childNotifications
      };
    }));
    // Flatten notifications
    const notifications = children.flatMap(c => (c && c.notifications ? c.notifications : []));
    res.json({
      children: children.filter(Boolean),
      notifications
    });
  } catch (err) {
    console.error('[ParentDashboard]', err);
    res.status(500).json({ message: 'Failed to load parent dashboard.' });
  }
};
// server/controllers/parentController.js

// Placeholder for future parent-specific routes and logic

const getParentDashboard = (req, res) => {
  res.json({ message: `Welcome to the Parent Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.` });
};

export { getParentDashboard };
