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
  getClassStudents,
  updateStudent,
  getClassCourses
} from '../controllers/teacherController.js';

import {
  getResultTemplate,
  getMyClassResults,
  getResultById,
  saveResult,
  submitResult,
  submitMultipleResults,
  deleteResult
} from '../controllers/resultController.js';

import {
  getSchoolBranding
} from '../controllers/adminController.js';

import {
  getSubjectScores,
  saveSubjectScores,
  getScoreCompletion,
  getMySubjectsAndClasses,
  getScoresForStudentRoute,
} from '../controllers/subjectScoreController.js';

const router = express.Router();

// ========== DASHBOARD ==========
router.get('/dashboard', protect, requireRole('teacher'), getTeacherDashboard);

// ========== SCHOOL BRANDING (for result sheet rendering) ==========
router.get('/school-branding', protect, requireRole('teacher'), getSchoolBranding);

// ========== CLASSES AND COURSES ==========
router.get('/classes-courses', getClassesAndCourses);
router.get('/school-classes', protect, requireRole('teacher'), getTeacherSchoolClasses);

// ========== ONBOARDING ==========
router.post('/onboarding/class-teacher', protect, requireRole('teacher'), saveClassTeacherInfo);

// ========== STUDENT MANAGEMENT ==========
router.post('/students/bulk',            protect, requireRole('teacher'), bulkAddStudents);
router.put('/students/:studentId',       protect, requireRole('teacher'), updateStudent);
router.get('/my-class/students',         protect, requireRole('teacher'), getMyClassStudents);
router.get('/class/:classId/students',   protect, requireRole('teacher'), getClassStudents);
router.get('/class/:classId/courses',    protect, requireRole('teacher'), getClassCourses);

// ========== PROFILE ==========
router.put('/profile', protect, requireRole('teacher'), updateTeacherProfile);

// ========== RESULT MANAGEMENT (class teacher) ==========
router.get('/results/template',               protect, requireRole('teacher'), getResultTemplate);
router.get('/results',                        protect, requireRole('teacher'), getMyClassResults);
router.get('/results/:resultId',              protect, requireRole('teacher'), getResultById);
router.post('/results',                       protect, requireRole('teacher'), saveResult);
router.put('/results/:resultId/submit',       protect, requireRole('teacher'), submitResult);
router.post('/results/submit-multiple',       protect, requireRole('teacher'), submitMultipleResults);
router.delete('/results/:resultId',           protect, requireRole('teacher'), deleteResult);

// ========== SUBJECT SCORE ENTRY (subject teachers) ==========
// NOTE: specific routes (/my-subjects, /completion, /for-student) MUST come
// before the parameterised GET /?classId= route to avoid Express matching conflicts.

// Get teacher's assigned subjects + classes (landing page data)
router.get('/subject-scores/my-subjects',   protect, requireRole('teacher'), getMySubjectsAndClasses);

// Get subject score completion for a class (class teacher overview)
router.get('/subject-scores/completion',    protect, requireRole('teacher'), getScoreCompletion);

// Get all SubjectScores for a single student (used by VisualResultEntry to pre-fill)
router.get('/subject-scores/for-student',   protect, requireRole('teacher'), getScoresForStudentRoute);

// Get scores for subject teacher's table (classId + subject + term + session)
router.get('/subject-scores',               protect, requireRole('teacher'), getSubjectScores);

// Save / upsert scores for a subject in a class
router.post('/subject-scores',              protect, requireRole('teacher'), saveSubjectScores);

export default router;