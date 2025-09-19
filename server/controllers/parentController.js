// server/controllers/parentController.js

// Placeholder for future parent-specific routes and logic

const getParentDashboard = (req, res) => {
  res.json({ message: `Welcome to the Parent Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.` });
};

export { getParentDashboard };
