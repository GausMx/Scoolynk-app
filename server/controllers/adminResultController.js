// server/controllers/adminResultController.js - VISUAL TEMPLATE BUILDER

import Result from '../models/Result.js'; 
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import SMSService from '../services/smsService.js';
import { generateResultPDFBase64 } from '../services/pdfResultService.js';
// ✅ CREATE RESULT TEMPLATE (Visual Builder)
export const createResultTemplate = async (req, res) => {
  try {
    const { name, term, session, schoolId, components } = req.body;

    if (!name || !term || !session || !components) {
      return res.status(400).json({ 
        message: 'Name, term, session, and components are required.' 
      });
    }

    // Check if template already exists for this term/session
    const existingTemplate = await ResultTemplate.findOne({
      schoolId: schoolId || req.user.schoolId,
      term,
      session,
      isActive: true
    });

    if (existingTemplate) {
      return res.status(400).json({
        message: `A template already exists for ${term}, ${session}. Please edit or deactivate it first.`
      });
    }

    // Create new template with component-based structure
    const template = new ResultTemplate({
      schoolId: schoolId || req.user.schoolId,
      name,
      term,
      session,
      templateType: 'visual', // NEW: Mark as visual template
      components, // Store component configuration
      createdBy: req.user._id,
      isActive: true
    });

    await template.save();

    res.status(201).json({ 
      message: 'Result template created successfully.',
      template 
    });
  } catch (err) {
    console.error('[CreateResultTemplate]', err);
    res.status(500).json({ message: 'Failed to create template.', error: err.message });
  }
};

// ✅ UPDATE RESULT TEMPLATE
export const updateResultTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, term, session, components, isActive } = req.body;

    const template = await ResultTemplate.findOne({
      _id: id,
      schoolId: req.user.schoolId
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found.' });
    }

    // Update fields
    if (name) template.name = name;
    if (term) template.term = term;
    if (session) template.session = session;
    if (components) template.components = components;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    res.json({ 
      message: 'Template updated successfully.',
      template 
    });
  } catch (err) {
    console.error('[UpdateResultTemplate]', err);
    res.status(500).json({ message: 'Failed to update template.' });
  }
};

// ✅ GET ALL TEMPLATES
export const getResultTemplates = async (req, res) => {
  try {
    const { term, session, isActive } = req.query;

    const query = { schoolId: req.user.schoolId };
    if (term) query.term = term;
    if (session) query.session = session;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await ResultTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (err) {
    console.error('[GetResultTemplates]', err);
    res.status(500).json({ message: 'Failed to fetch templates.' });
  }
};

// ✅ GET SINGLE TEMPLATE
export const getResultTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await ResultTemplate.findOne({
      _id: id,
      schoolId: req.user.schoolId
    }).populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ message: 'Template not found.' });
    }

    res.json({ template });
  } catch (err) {
    console.error('[GetResultTemplate]', err);
    res.status(500).json({ message: 'Failed to fetch template.' });
  }
};
// ✅ DELETE TEMPLATE (soft delete for active, hard delete for inactive)
export const deleteResultTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

    const template = await ResultTemplate.findOne({ 
      _id: id, 
      schoolId 
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found.' });
    }

    // ✅ If template is active, soft delete (deactivate)
    if (template.isActive) {
      template.isActive = false;
      await template.save();
      return res.json({ 
        message: 'Template deactivated successfully. You can delete it permanently from the inactive templates section.',
        deactivated: true
      });
    }

    // ✅ If template is already inactive, permanently delete
    await ResultTemplate.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Template permanently deleted.',
      deleted: true
    });
  } catch (err) {
    console.error('[DeleteResultTemplate]', err);
    res.status(500).json({ message: 'Failed to delete template.' });
  }
};

// ✅ DUPLICATE TEMPLATE FOR NEW TERM/SESSION
export const duplicateResultTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { newTerm, newSession, newName } = req.body;

    if (!newTerm || !newSession) {
      return res.status(400).json({ 
        message: 'New term and session are required.' 
      });
    }

    const originalTemplate = await ResultTemplate.findOne({
      _id: id,
      schoolId: req.user.schoolId
    });

    if (!originalTemplate) {
      return res.status(404).json({ message: 'Original template not found.' });
    }

    // Check if template already exists for new term/session
    const existingTemplate = await ResultTemplate.findOne({
      schoolId: req.user.schoolId,
      term: newTerm,
      session: newSession,
      isActive: true
    });

    if (existingTemplate) {
      return res.status(400).json({
        message: `A template already exists for ${newTerm}, ${newSession}.`
      });
    }

    // Create duplicate
    const newTemplate = new ResultTemplate({
      schoolId: originalTemplate.schoolId,
      name: newName || `${originalTemplate.name} (${newTerm} - ${newSession})`,
      term: newTerm,
      session: newSession,
      templateType: originalTemplate.templateType,
      components: originalTemplate.components,
      createdBy: req.user._id,
      isActive: true
    });

    await newTemplate.save();

    res.status(201).json({
      message: 'Template duplicated successfully.',
      template: newTemplate
    });
  } catch (err) {
    console.error('[DuplicateResultTemplate]', err);
    res.status(500).json({ message: 'Failed to duplicate template.' });
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

// Review and edit result
export const reviewResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const {
      action, // 'approve' or 'reject'
      subjects,
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

    // Admin can edit all fields
    if (subjects) result.subjects = subjects;
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

    const school = await School.findById(req.user.schoolId).select('name phone address');

    try {
      // Generate PDF as Base64 (stored in memory, then in MongoDB)
      console.log('[SendResultToParent] Generating PDF...');
      const pdfResult = await generateResultPDFBase64(result, school);

      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF');
      }

      console.log('[SendResultToParent] PDF generated, size:', pdfResult.size, 'bytes');

      // Store Base64 PDF in MongoDB (no files!)
      result.pdfBase64 = pdfResult.base64;

      // Create download link
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const downloadLink = `${baseUrl}/api/results/download/${result._id}`;

      // Prepare SMS message
      const message = `Dear ${student.parentName || 'Parent'},\n\n` +
        `${result.term} result for ${student.name} (${result.classId.name}) is ready.\n\n` +
        `Overall: ${result.overallTotal}/${result.subjects.length * 100} (${result.overallAverage}%) - Grade ${result.overallGrade}\n` +
        `Position: ${result.overallPosition || 'N/A'}\n\n` +
        `Download full result PDF:\n${downloadLink}\n\n` +
        `Or visit school to collect printed copy.\n\n` +
        `${school.name}\n${school.phone}`;

      // Send SMS
      const smsResult = await SMSService.sendSMS(student.parentPhone, message);

      if (!smsResult.success) {
        throw new Error(smsResult.error || 'Failed to send SMS');
      }

      result.status = 'sent';
      result.sentToParentAt = new Date();
      await result.save();

      res.json({ 
        message: 'Result PDF generated and download link sent to parent successfully.',
        sentTo: student.parentPhone,
        pdfGenerated: true,
        pdfSize: pdfResult.size,
        downloadLink
      });

    } catch (error) {
      console.error('[SMS/PDF Error]', error);
      return res.status(500).json({ 
        message: 'Failed to send result to parent.',
        error: error.message
      });
    }
  } catch (err) {
    console.error('[SendResultToParent]', err);
    res.status(500).json({ message: 'Failed to send result to parent.' });
  }
};

// REPLACE YOUR EXISTING sendMultipleResultsToParents FUNCTION WITH THIS:
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

    const school = await School.findById(req.user.schoolId).select('name phone address');
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    const messages = [];
    const successfulSends = [];
    const failedSends = [];

    console.log(`[SendMultipleResults] Generating ${results.length} PDFs...`);
    
    for (const result of results) {
      const student = result.student;

      if (!student.parentPhone) {
        failedSends.push({
          studentName: student.name,
          reason: 'No parent phone number'
        });
        continue;
      }

      try {
        // Generate PDF as Base64
        const pdfResult = await generateResultPDFBase64(result, school);

        if (!pdfResult.success) {
          failedSends.push({
            studentName: student.name,
            reason: 'PDF generation failed'
          });
          continue;
        }

        // Store in MongoDB
        result.pdfBase64 = pdfResult.base64;
        await result.save();

        // Create download link
        const downloadLink = `${baseUrl}/api/results/download/${result._id}`;

        // Prepare SMS
        const message = `Dear ${student.parentName || 'Parent'},\n\n` +
          `${result.term} result for ${student.name} (${result.classId.name}) is ready.\n\n` +
          `Overall: ${result.overallTotal}/${result.subjects.length * 100} (${result.overallAverage}%) - Grade ${result.overallGrade}\n` +
          `Position: ${result.overallPosition || 'N/A'}\n\n` +
          `Download full result PDF:\n${downloadLink}\n\n` +
          `Or visit school to collect printed copy.\n\n` +
          `${school.name}\n${school.phone}`;

        messages.push({
          to: student.parentPhone,
          message,
          resultId: result._id
        });

      } catch (pdfError) {
        console.error('[PDF Generation Error]', pdfError);
        failedSends.push({
          studentName: student.name,
          reason: 'PDF generation error: ' + pdfError.message
        });
      }
    }

    console.log(`[SendMultipleResults] Sending ${messages.length} SMS messages...`);

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
          reason: smsResult.error || 'Unknown SMS error'
        });
      }
    }

    res.json({
      message: `Sent ${successfulSends.length}/${messages.length} results with PDF links successfully.`,
      successCount: successfulSends.length,
      failureCount: failedSends.length,
      pdfsGenerated: messages.length,
      failed: failedSends
    });
  } catch (err) {
    console.error('[SendMultipleResultsToParents]', err);
    res.status(500).json({ message: 'Failed to send results to parents.' });
  }
};

// ADD THIS NEW FUNCTION (or replace if you have it):
export const downloadResultPDF = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      status: { $in: ['approved', 'sent'] }
    }).populate('student', 'name regNo');

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (!result.pdfBase64) {
      return res.status(404).json({ 
        message: 'PDF not available. Please contact school to regenerate.' 
      });
    }

    // Convert Base64 back to Buffer
    const pdfBuffer = Buffer.from(result.pdfBase64, 'base64');

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="Result_${result.student.regNo}_${result.term.replace(/\s+/g, '_')}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (err) {
    console.error('[DownloadResultPDF]', err);
    res.status(500).json({ message: 'Failed to download result PDF.' });
  }
};// Get all results (for admin overview)
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