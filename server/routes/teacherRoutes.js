// server/routes/teacherRoutes.js

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
} from '../controllers/teacherController.js';

const router = express.Router();

// Teacher Dashboard
router.get('/dashboard', protect, requireRole('teacher'), getTeacherDashboard);

// Get Classes and Courses for Registration (Public - needs schoolCode)
router.get('/classes-courses', getClassesAndCourses);

// Get Classes for Authenticated Teacher (for onboarding)
router.get('/school-classes', protect, requireRole('teacher'), getTeacherSchoolClasses);

// Save Class Teacher Info (Onboarding step)
router.post('/onboarding/class-teacher', protect, requireRole('teacher'), saveClassTeacherInfo);

// Bulk Add Students
router.post('/students/bulk', protect, requireRole('teacher'), bulkAddStudents);

// Update Teacher Profile (Edit classes/courses)
router.put('/profile', protect, requireRole('teacher'), updateTeacherProfile);

// Get Students in Teacher's Class
router.get('/my-class/students', protect, requireRole('teacher'), getMyClassStudents);

export default router;