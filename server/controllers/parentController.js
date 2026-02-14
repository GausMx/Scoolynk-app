// server/controllers/parentController.js - NEW FILE

import Result from '../models/Result.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import School from '../models/School.js';

// ========== GET PARENT DASHBOARD ==========
export const getParentDashboard = async (req, res) => {
  try {
    const parentId = req.user._id;
    const schoolId = req.user.schoolId;

    console.log('[ParentDashboard] Loading for parent:', parentId);

    // Get parent with children
    const parent = await User.findById(parentId)
      .populate({
        path: 'children',
        populate: { path: 'classId', select: 'name' }
      });

    if (!parent || !parent.children || parent.children.length === 0) {
      return res.json({
        children: [],
        totalChildren: 0,
        recentResults: [],
        notifications: [],
        message: 'No children linked to this account. Please contact the school admin.'
      });
    }

    // Get school info
    const school = await School.findById(schoolId).select('name address phone motto');

    // Get all children IDs
    const childrenIds = parent.children.map(child => child._id);

    // Get recent results for all children
    const recentResults = await Result.find({
      student: { $in: childrenIds },
      schoolId,
      status: { $in: ['approved', 'sent', 'verified'] }
    })
    .populate('student', 'name regNo')
    .populate('classId', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    // Count total results
    const totalResults = await Result.countDocuments({
      student: { $in: childrenIds },
      schoolId,
      status: { $in: ['approved', 'sent', 'verified'] }
    });

    // Calculate average performance across all children
    const allResults = await Result.find({
      student: { $in: childrenIds },
      schoolId,
      status: { $in: ['approved', 'sent', 'verified'] }
    }).select('overallAverage overallGrade');

    const avgPerformance = allResults.length > 0
      ? Math.round(allResults.reduce((sum, r) => sum + (r.overallAverage || 0), 0) / allResults.length)
      : 0;

    // Get notifications (new results)
    const notifications = recentResults
      .filter(r => {
        const createdDate = new Date(r.createdAt);
        const daysSinceCreated = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
        return daysSinceCreated <= 7; // New in last 7 days
      })
      .map(r => ({
        id: r._id,
        type: 'new_result',
        message: `New result available for ${r.student.name} - ${r.term}, ${r.session}`,
        studentName: r.student.name,
        resultId: r._id,
        createdAt: r.createdAt
      }));

    res.json({
      school: {
        name: school.name,
        address: school.address,
        phone: school.phone,
        motto: school.motto
      },
      children: parent.children,
      totalChildren: parent.children.length,
      totalResults,
      avgPerformance,
      recentResults,
      notifications
    });

  } catch (err) {
    console.error('[ParentDashboard Error]', err);
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
};

// ========== GET MY CHILDREN ==========
export const getMyChildren = async (req, res) => {
  try {
    const parentId = req.user._id;
    const schoolId = req.user.schoolId;

    const parent = await User.findById(parentId)
      .populate({
        path: 'children',
        match: { schoolId },
        populate: { path: 'classId', select: 'name' }
      });

    if (!parent || !parent.children) {
      return res.json({ children: [] });
    }

    // Get result counts for each child
    const childrenWithStats = await Promise.all(
      parent.children.map(async (child) => {
        const resultsCount = await Result.countDocuments({
          student: child._id,
          schoolId,
          status: { $in: ['approved', 'sent', 'verified'] }
        });

        const latestResult = await Result.findOne({
          student: child._id,
          schoolId,
          status: { $in: ['approved', 'sent', 'verified'] }
        })
        .sort({ createdAt: -1 })
        .select('overallAverage overallGrade term session');

        return {
          ...child.toObject(),
          resultsCount,
          latestResult
        };
      })
    );

    res.json({ children: childrenWithStats });
  } catch (err) {
    console.error('[GetMyChildren Error]', err);
    res.status(500).json({ message: 'Failed to fetch children.' });
  }
};

// ========== GET CHILD RESULTS ==========
export const getChildResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, session } = req.query;
    const parentId = req.user._id;
    const schoolId = req.user.schoolId;

    // Verify parent owns this child
    const parent = await User.findById(parentId);
    const hasAccess = parent.children.some(
      childId => childId.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'Access denied. This student is not linked to your account.' 
      });
    }

    // Build query
    const query = {
      student: studentId,
      schoolId,
      status: { $in: ['approved', 'sent', 'verified'] }
    };

    if (term) query.term = term;
    if (session) query.session = session;

    const results = await Result.find(query)
      .populate('student', 'name regNo')
      .populate('classId', 'name')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    // Get student info
    const student = await Student.findById(studentId)
      .populate('classId', 'name');

    res.json({ 
      student,
      results,
      totalResults: results.length
    });
  } catch (err) {
    console.error('[GetChildResults Error]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

// ========== GET SINGLE RESULT DETAILS ==========
export const getResultDetails = async (req, res) => {
  try {
    const { resultId } = req.params;
    const parentId = req.user._id;
    const schoolId = req.user.schoolId;

    const result = await Result.findOne({
      _id: resultId,
      schoolId,
      status: { $in: ['approved', 'sent', 'verified'] }
    })
    .populate('student', 'name regNo parentName parentPhone')
    .populate('classId', 'name')
    .populate('teacher', 'name');

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    // Verify parent owns this child
    const parent = await User.findById(parentId);
    const hasAccess = parent.children.some(
      childId => childId.toString() === result.student._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'Access denied. This result does not belong to your child.' 
      });
    }

    res.json({ result });
  } catch (err) {
    console.error('[GetResultDetails Error]', err);
    res.status(500).json({ message: 'Failed to fetch result details.' });
  }
};

// ========== GET PERFORMANCE ANALYTICS ==========
export const getPerformanceAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parentId = req.user._id;
    const schoolId = req.user.schoolId;

    // Verify parent owns this child
    const parent = await User.findById(parentId);
    const hasAccess = parent.children.some(
      childId => childId.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Get all approved results for this student
    const results = await Result.find({
      student: studentId,
      schoolId,
      status: { $in: ['approved', 'sent', 'verified'] }
    })
    .sort({ createdAt: 1 })
    .select('term session overallAverage overallGrade overallTotal overallPosition subjects createdAt');

    // Calculate trends
    const performanceTrend = results.map(r => ({
      term: r.term,
      session: r.session,
      average: r.overallAverage,
      grade: r.overallGrade,
      position: r.overallPosition,
      date: r.createdAt
    }));

    // Subject performance (average across all terms)
    const subjectStats = {};
    results.forEach(result => {
      result.subjects.forEach(subject => {
        if (!subjectStats[subject.subject]) {
          subjectStats[subject.subject] = {
            subject: subject.subject,
            totalScore: 0,
            count: 0,
            grades: []
          };
        }
        subjectStats[subject.subject].totalScore += subject.total || 0;
        subjectStats[subject.subject].count += 1;
        subjectStats[subject.subject].grades.push(subject.grade);
      });
    });

    const subjectPerformance = Object.values(subjectStats).map(stat => ({
      subject: stat.subject,
      averageScore: Math.round(stat.totalScore / stat.count),
      averageGrade: stat.grades[stat.grades.length - 1] // Most recent grade
    }));

    res.json({
      performanceTrend,
      subjectPerformance,
      totalResults: results.length,
      bestGrade: results.length > 0 
        ? results.reduce((best, r) => r.overallAverage > best ? r.overallAverage : best, 0)
        : null,
      latestPosition: results.length > 0 
        ? results[results.length - 1].overallPosition 
        : null
    });
  } catch (err) {
    console.error('[GetPerformanceAnalytics Error]', err);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
};