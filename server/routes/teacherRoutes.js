import { getTeacherClasses, getClassStudents, submitGrades } from '../controllers/teacherController.js';

// GET /teacher/classes - all classes/courses taught by teacher
router.get('/classes', protect, requireRole('teacher'), getTeacherClasses);

// GET /teacher/students?classId=... - all students in a class
router.get('/students', protect, requireRole('teacher'), getClassStudents);

// POST /teacher/grades - submit grades for a class
router.post('/grades', protect, requireRole('teacher'), submitGrades);
import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import teacherController from '../controllers/teacherController.js';

const router = express.Router();

// Example: Only teacher of the same school can access
router.get('/dashboard', protect, requireRole('teacher'), teacherController.dashboard);

// Add more teacher routes here, always use protect and requireRole('teacher')

export default router;
