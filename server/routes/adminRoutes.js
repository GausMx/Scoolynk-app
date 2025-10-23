// server/routes/adminRoutes.js

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import subscriptionGuard from '../middleware/subscriptionMiddleware.js';
import {
  getSubmittedResults,
  reviewResult,
  getAdminSettings,
  updateAdminSettings,
  getAdminDashboard,
  getSchoolCode,
  getClasses,
  updateClass,
  deleteClass,
  createClass,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getClassCourses,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard (Mounted at /api/admin)
router.get('/', protect, subscriptionGuard, requireRole('admin'), getAdminDashboard);

// Review submitted results
router.get('/results', protect, requireRole('admin'), getSubmittedResults);
router.post('/results/review', protect, requireRole('admin'), reviewResult);

// Settings
router.get('/settings', protect, requireRole('admin'), getAdminSettings);
router.put('/settings', protect, requireRole('admin'), updateAdminSettings);

// School code
router.get('/school/code', protect, requireRole('admin'), getSchoolCode);

// Class routes
router.get('/classes', protect, requireRole('admin'), getClasses);
router.post('/classes', protect, requireRole('admin'), createClass);
router.put('/classes/:id', protect, requireRole('admin'), updateClass);
router.delete('/classes/:id', protect, requireRole('admin'), deleteClass);
router.get('/classes/:id/courses', protect, requireRole('admin'), getClassCourses);

// Course routes
router.get('/courses', protect, requireRole('admin'), getCourses);
router.post('/courses', protect, requireRole('admin'), createCourse);
router.put('/courses/:id', protect, requireRole('admin'), updateCourse);
router.delete('/courses/:id', protect, requireRole('admin'), deleteCourse);

// Teacher management routes
router.get('/teachers', protect, requireRole('admin'), getTeachers);
router.put('/teachers/:id', protect, requireRole('admin'), updateTeacher);
router.delete('/teachers/:id', protect, requireRole('admin'), deleteTeacher);

// Student management routes
router.get('/students', protect, requireRole('admin'), getStudents);
router.post('/students', protect, requireRole('admin'), createStudent);
router.put('/students/:id', protect, requireRole('admin'), updateStudent);
router.delete('/students/:id', protect, requireRole('admin'), deleteStudent);

export default router;