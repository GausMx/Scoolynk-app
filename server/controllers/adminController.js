// server/controllers/adminController.js

// Placeholder for future admin-specific routes and logic

const getAdminDashboard = (req, res) => {
  res.json({ message: `Welcome to the Admin Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.` });
};

export { getAdminDashboard };
