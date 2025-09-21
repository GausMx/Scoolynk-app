// Get all classes/courses taught by teacher
export const getTeacherClasses = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const teacher = await User.findOne({ _id: req.user._id, schoolId }).populate({
      path: 'classes',
      match: { schoolId }
    });
    if (!teacher) {
      console.error(`[TeacherClasses] Teacher not found or not in school: ${req.user._id}, school: ${schoolId}`);
      return res.status(404).json({ message: 'Teacher not found.' });
    }
    res.json({ classes: teacher.classes || [] });
  } catch (err) {
    console.error('[TeacherClasses]', err);
    res.status(500).json({ message: 'Failed to load classes.' });
  }
};

// Get all students in a class
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.query;
    const schoolId = req.user.schoolId;
    const students = await Student.find({ classId, schoolId });
    res.json({ students });
  } catch (err) {
    console.error('[ClassStudents]', err);
    res.status(500).json({ message: 'Failed to load students.' });
  }
};

// Submit grades for a class
export const submitGrades = async (req, res) => {
  try {
    const { classId, grades } = req.body;
    const schoolId = req.user.schoolId;
    const Result = (await import('../models/Result.js')).default;
    // grades: { studentId: { subject: grade, ... }, ... }
    for (const [studentId, subjects] of Object.entries(grades)) {
      for (const [subject, grade] of Object.entries(subjects)) {
        // Upsert result for student/subject/class, filter by schoolId
        await Result.findOneAndUpdate(
          { student: studentId, classId, subject },
          { grade, status: 'submitted', teacher: req.user._id },
          { upsert: true, new: true }
        );
        // Notification: result submitted (expand to notify admin/parent as needed)
        // e.g., push to a notification queue or log
        console.log(`[GradeSubmitted] Teacher ${req.user._id} submitted grade for student ${studentId}, subject ${subject}, class ${classId}, school ${schoolId}`);
      }
    }
    res.json({ message: 'Grades submitted.' });
  } catch (err) {
    console.error('[SubmitGrades]', err);
    res.status(500).json({ message: 'Failed to submit grades.' });
  }
};
// server/controllers/teacherController.js

// Placeholder for future teacher-specific routes and logic

const getTeacherDashboard = (req, res) => {
  res.json({ message: `Welcome to the Teacher Dashboard, ${req.user.name}. Your school ID is ${req.user.schoolId}.` });
};

export { getTeacherDashboard };
