// server/routes/teacherRoutes.js - COMPLETE FILE

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getTeacherDashboard,
  getClassesAndCourses,
  getTeacherSchoolClasses,
  saveClassTeacherInfo,
  bulkAddStudents,
  updateTeacherProfile,
  getMyClassStudents,
  getClassStudents,
  updateStudent
} from '../controllers/teacherController.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', protect, requireRole('teacher'), getTeacherDashboard);

// Classes and courses
router.get('/classes-courses', getClassesAndCourses);
router.get('/school-classes', protect, requireRole('teacher'), getTeacherSchoolClasses);

// Onboarding
router.post('/onboarding/class-teacher', protect, requireRole('teacher'), saveClassTeacherInfo);

// Student management
router.post('/students/bulk', protect, requireRole('teacher'), bulkAddStudents);
router.put('/students/:studentId', protect, requireRole('teacher'), updateStudent);
router.get('/my-class/students', protect, requireRole('teacher'), getMyClassStudents);
router.get('/classes/:classId/students', protect, requireRole('teacher'), getClassStudents);

// Profile
router.put('/profile', protect, requireRole('teacher'), updateTeacherProfile);

export default router;