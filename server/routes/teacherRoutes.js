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
  getClassStudents
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

// Bulk Add Students (with payment fields support)
router.post('/students/bulk', protect, requireRole('teacher'), bulkAddStudents);

// Update Teacher Profile (Edit classes/courses)
router.put('/profile', protect, requireRole('teacher'), updateTeacherProfile);

// Get Students in Teacher's Class (all classes they're class teacher for)
router.get('/my-class/students', protect, requireRole('teacher'), getMyClassStudents);

// Get Students in a Specific Class (with payment info) - NEW
router.get('/classes/:classId/students', protect, requireRole('teacher'), getClassStudents);

export default router;