// server/controllers/adminResultController.js - ADMIN RESULT MANAGEMENT

import Result from '../models/Result.js'; 
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import SMSService from '../services/smsService.js';
import OCRService from '../services/ocrService.js';

// Upload and process result template
export const uploadResultTemplate = async (req, res) => {
  try {
    const { base64Image, term, session, name } = req.body;

    if (!base64Image || !term || !session) {
      return res.status(400).json({ 
        message: 'Image, term, and session are required.' 
      });
    }

    // Deactivate existing templates for this term/session
    await ResultTemplate.updateMany(
      {
        schoolId: req.user.schoolId,
        term,
        session
      },
      { isActive: false }
    );

    // Extract template structure using OCR
    const ocrResult = await OCRService.extractFromBase64(base64Image);

    // Create basic template structure
    // In production, you'd use more sophisticated image processing
    // to detect boxes, lines, and field positions
    const template = new ResultTemplate({
      schoolId: req.user.schoolId,
      name: name || `${term} ${session} Result Template`,
      term,
      session,
      templateImage: base64Image,
      createdBy: req.user._id,
      layout: {
        header: {
          schoolName: {
            label: 'School Name',
            type: 'text',
            coordinates: { x: 100, y: 50, width: 400, height: 40 },
            isEditable: false,
            category: 'other'
          },
          logo: {
            label: 'School Logo',
            type: 'image',
            coordinates: { x: 50, y: 30, width: 80, height: 80 },
            isEditable: false,
            category: 'other'
          },
          address: {
            label: 'School Address',
            type: 'text',
            coordinates: { x: 100, y: 100, width: 400, height: 30 },
            isEditable: false,
            category: 'other'
          }
        },
        studentInfo: {
          name: {
            label: 'Student Name',
            type: 'text',
            coordinates: { x: 100, y: 150, width: 300, height: 30 },
            isEditable: false,
            category: 'student_info'
          },
          regNo: {
            label: 'Reg No',
            type: 'text',
            coordinates: { x: 100, y: 190, width: 200, height: 30 },
            isEditable: false,
            category: 'student_info'
          },
          className: {
            label: 'Class',
            type: 'text',
            coordinates: { x: 100, y: 230, width: 150, height: 30 },
            isEditable: false,
            category: 'student_info'
          },
          session: {
            label: 'Session',
            type: 'text',
            coordinates: { x: 300, y: 230, width: 150, height: 30 },
            isEditable: false,
            category: 'student_info'
          },
          photo: {
            label: 'Student Photo',
            type: 'image',
            coordinates: { x: 500, y: 150, width: 100, height: 120 },
            isEditable: false,
            category: 'student_info'
          }
        },
        scoresTable: {
          headers: [
            { name: 'Subject', coordinates: { x: 50, y: 300, width: 150, height: 30 } },
            { name: 'CA1', coordinates: { x: 200, y: 300, width: 60, height: 30 } },
            { name: 'CA2', coordinates: { x: 260, y: 300, width: 60, height: 30 } },
            { name: 'Exam', coordinates: { x: 320, y: 300, width: 60, height: 30 } },
            { name: 'Total', coordinates: { x: 380, y: 300, width: 60, height: 30 } },
            { name: 'Grade', coordinates: { x: 440, y: 300, width: 60, height: 30 } },
            { name: 'Remark', coordinates: { x: 500, y: 300, width: 100, height: 30 } }
          ],
          rowHeight: 35,
          startY: 330,
          subjectColumn: { x: 50, width: 150 }
        },
        affective: {
          traits: [
            { name: 'Punctuality', field: { label: 'Punctuality', type: 'number', coordinates: { x: 50, y: 700, width: 200, height: 25 }, category: 'affective' } },
            { name: 'Behaviour', field: { label: 'Behaviour', type: 'number', coordinates: { x: 50, y: 730, width: 200, height: 25 }, category: 'affective' } },
            { name: 'Neatness', field: { label: 'Neatness', type: 'number', coordinates: { x: 50, y: 760, width: 200, height: 25 }, category: 'affective' } },
            { name: 'Relationship', field: { label: 'Relationship', type: 'number', coordinates: { x: 50, y: 790, width: 200, height: 25 }, category: 'affective' } }
          ]
        },
        fees: {
          fields: [
            { name: 'Tuition', field: { label: 'Tuition', type: 'number', coordinates: { x: 350, y: 700, width: 200, height: 25 }, category: 'fees' } },
            { name: 'Uniform', field: { label: 'Uniform', type: 'number', coordinates: { x: 350, y: 730, width: 200, height: 25 }, category: 'fees' } },
            { name: 'Books', field: { label: 'Books', type: 'number', coordinates: { x: 350, y: 760, width: 200, height: 25 }, category: 'fees' } }
          ]
        },
        attendance: {
          opened: { label: 'Days Opened', type: 'number', coordinates: { x: 50, y: 850, width: 150, height: 25 }, category: 'attendance' },
          present: { label: 'Days Present', type: 'number', coordinates: { x: 220, y: 850, width: 150, height: 25 }, category: 'attendance' },
          absent: { label: 'Days Absent', type: 'number', coordinates: { x: 390, y: 850, width: 150, height: 25 }, category: 'attendance' }
        },
        comments: {
          teacher: { label: "Teacher's Comment", type: 'text', coordinates: { x: 50, y: 900, width: 500, height: 60 }, category: 'comments', isEditable: true },
          principal: { label: "Principal's Comment", type: 'text', coordinates: { x: 50, y: 970, width: 500, height: 60 }, category: 'comments', isEditable: true }
        },
        signatures: {
          teacher: { label: "Teacher's Signature", type: 'signature', coordinates: { x: 50, y: 1050, width: 200, height: 50 }, category: 'other' },
          principal: { label: "Principal's Signature", type: 'signature', coordinates: { x: 350, y: 1050, width: 200, height: 50 }, category: 'other' }
        }
      }
    });

    await template.save();

    res.status(201).json({ 
      message: 'Result template uploaded successfully.',
      template 
    });
  } catch (err) {
    console.error('[UploadResultTemplate]', err);
    res.status(500).json({ message: 'Failed to upload template.' });
  }
};

// Get all result templates
export const getResultTemplates = async (req, res) => {
  try {
    const templates = await ResultTemplate.find({
      schoolId: req.user.schoolId
    })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (err) {
    console.error('[GetResultTemplates]', err);
    res.status(500).json({ message: 'Failed to fetch templates.' });
  }
};

// Get submitted results for review
export const getSubmittedResults = async (req, res) => {
  try {
    const { term, session, classId } = req.query;

    const query = {
      schoolId: req.user.schoolId,
      status: 'submitted'
    };

    if (term) query.term = term;
    if (session) query.session = session;
    if (classId) query.classId = classId;

    const results = await Result.find(query)
      .populate('student', 'name regNo parentPhone parentName')
      .populate('classId', 'name')
      .populate('teacher', 'name')
      .sort({ submittedAt: -1 });

    res.json({ results });
  } catch (err) {
    console.error('[GetSubmittedResults]', err);
    res.status(500).json({ message: 'Failed to fetch submitted results.' });
  }
};

// Review and edit result (admin can edit everything except scores)
export const reviewResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const {
      action, // 'approve' or 'reject'
      affectiveTraits,
      fees,
      attendance,
      comments,
      rejectionReason
    } = req.body;

    const result = await Result.findOne({
      _id: resultId,
      schoolId: req.user.schoolId
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (result.status !== 'submitted') {
      return res.status(400).json({ 
        message: 'Only submitted results can be reviewed.' 
      });
    }

    // Admin can edit non-score fields
    if (affectiveTraits) result.affectiveTraits = affectiveTraits;
    if (fees) result.fees = fees;
    if (attendance) result.attendance = attendance;
    if (comments) result.comments = comments;

    // Update status
    if (action === 'approve') {
      result.status = 'approved';
    } else if (action === 'reject') {
      result.status = 'rejected';
      result.rejectionReason = rejectionReason || 'Rejected by admin';
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
    }

    result.reviewedAt = new Date();
    result.reviewedBy = req.user._id;

    await result.save();

    res.json({ 
      message: action === 'approve' 
        ? 'Result approved successfully.' 
        : 'Result rejected and sent back to teacher.',
      result 
    });
  } catch (err) {
    console.error('[ReviewResult]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// Send approved result to parent via SMS
export const sendResultToParent = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      schoolId: req.user.schoolId,
      status: 'approved'
    })
    .populate('student', 'name regNo parentPhone parentName')
    .populate('classId', 'name');

    if (!result) {
      return res.status(404).json({ 
        message: 'Result not found or not approved.' 
      });
    }

    const student = result.student;

    if (!student.parentPhone) {
      return res.status(400).json({ 
        message: 'Parent phone number not available for this student.' 
      });
    }

    const school = await School.findById(req.user.schoolId).select('name phone');

    // Prepare SMS message
    const message = `Dear ${student.parentName || 'Parent'},\n\n` +
      `${result.term} result for ${student.name} (${result.classId.name}) is ready.\n\n` +
      `Overall: ${result.overallTotal}/${result.subjects.length * 100} (${result.overallAverage}%) - ${result.overallGrade}\n` +
      `Position: ${result.overallPosition || 'N/A'}\n\n` +
      `Teacher's Comment: ${result.comments.teacher || 'N/A'}\n\n` +
      `Visit school for full result.\n\n` +
      `${school.name}\n${school.phone}`;

    try {
      await SMSService.sendMessage(student.parentPhone, message, school);

      result.status = 'sent';
      result.sentToParentAt = new Date();
      await result.save();

      res.json({ 
        message: 'Result sent to parent successfully.',
        sentTo: student.parentPhone
      });
    } catch (smsError) {
      console.error('[SMS Error]', smsError);
      return res.status(500).json({ 
        message: 'Failed to send SMS to parent.',
        error: smsError.message
      });
    }
  } catch (err) {
    console.error('[SendResultToParent]', err);
    res.status(500).json({ message: 'Failed to send result to parent.' });
  }
};

// Send multiple approved results to parents
export const sendMultipleResultsToParents = async (req, res) => {
  try {
    const { resultIds } = req.body;

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ message: 'Result IDs array is required.' });
    }

    const results = await Result.find({
      _id: { $in: resultIds },
      schoolId: req.user.schoolId,
      status: 'approved'
    })
    .populate('student', 'name regNo parentPhone parentName')
    .populate('classId', 'name');

    if (results.length === 0) {
      return res.status(404).json({ message: 'No approved results found.' });
    }

    const school = await School.findById(req.user.schoolId).select('name phone');

    const messages = [];
    const successfulSends = [];
    const failedSends = [];

    for (const result of results) {
      const student = result.student;

      if (!student.parentPhone) {
        failedSends.push({
          studentName: student.name,
          reason: 'No parent phone number'
        });
        continue;
      }

      const message = `Dear ${student.parentName || 'Parent'},\n\n` +
        `${result.term} result for ${student.name} (${result.classId.name}) is ready.\n\n` +
        `Overall: ${result.overallTotal}/${result.subjects.length * 100} (${result.overallAverage}%) - ${result.overallGrade}\n` +
        `Position: ${result.overallPosition || 'N/A'}\n\n` +
        `Teacher's Comment: ${result.comments.teacher || 'N/A'}\n\n` +
        `Visit school for full result.\n\n` +
        `${school.name}\n${school.phone}`;

      messages.push({
        to: student.parentPhone,
        message,
        resultId: result._id
      });
    }

    // Send all messages
    const smsResults = await SMSService.sendBulkMessages(messages);

    // Update results that were sent successfully
    for (let i = 0; i < smsResults.length; i++) {
      const smsResult = smsResults[i];
      const messageData = messages[i];

      if (smsResult.success) {
        await Result.findByIdAndUpdate(messageData.resultId, {
          status: 'sent',
          sentToParentAt: new Date()
        });
        successfulSends.push(messageData.resultId);
      } else {
        failedSends.push({
          resultId: messageData.resultId,
          reason: smsResult.error || 'Unknown error'
        });
      }
    }

    res.json({
      message: `Sent ${successfulSends.length}/${messages.length} results successfully.`,
      successCount: successfulSends.length,
      failureCount: failedSends.length,
      failed: failedSends
    });
  } catch (err) {
    console.error('[SendMultipleResultsToParents]', err);
    res.status(500).json({ message: 'Failed to send results to parents.' });
  }
};

// Get all results (for admin overview)
export const getAllResults = async (req, res) => {
  try {
    const { term, session, status, classId } = req.query;

    const query = { schoolId: req.user.schoolId };

    if (term) query.term = term;
    if (session) query.session = session;
    if (status) query.status = status;
    if (classId) query.classId = classId;

    const results = await Result.find(query)
      .populate('student', 'name regNo')
      .populate('classId', 'name')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    res.json({ results });
  } catch (err) {
    console.error('[GetAllResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};

export default {
  uploadResultTemplate,
  getResultTemplates,
  getSubmittedResults,
  reviewResult,
  sendResultToParent,
  sendMultipleResultsToParents,
  getAllResults
};