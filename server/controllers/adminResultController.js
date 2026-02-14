// server/controllers/adminResultController.js - CORRECTED VERSION (NO SMS)

import Result from '../models/Result.js'; 
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
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
      templateType: 'visual',
      components,
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

    if (template.isActive) {
      template.isActive = false;
      await template.save();
      return res.json({ 
        message: 'Template deactivated successfully. You can delete it permanently from the inactive templates section.',
        deactivated: true
      });
    }

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

// ✅ GET SUBMITTED RESULTS
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
      .populate('student', 'name regNo parentPhone parentName parentId')
      .populate('classId', 'name')
      .populate('teacher', 'name')
      .sort({ submittedAt: -1 });

    res.json({ results });
  } catch (err) {
    console.error('[GetSubmittedResults]', err);
    res.status(500).json({ message: 'Failed to fetch submitted results.' });
  }
};

// ✅ REVIEW RESULT
export const reviewResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { action, comments, rejectionReason } = req.body;

    console.log('[ReviewResult] Processing:', { resultId, action });

    const result = await Result.findById(resultId)
      .populate('student')
      .populate('classId', 'name');

    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    if (String(result.student.schoolId) !== String(req.user.schoolId)) {
      return res.status(403).json({ message: 'Not authorized for this school.' });
    }

    if (action === 'approve' || action === 'verify') {
      result.status = 'approved';
      result.approvedAt = new Date();
      result.approvedBy = req.user._id;
      
      if (comments) {
        result.comments = {
          teacher: comments.teacher || result.comments?.teacher || '',
          principal: comments.principal || result.comments?.principal || ''
        };
      }

      await result.save();

      console.log('[ReviewResult] Result approved/verified:', resultId);

      try {
        await Result.calculateClassPositions(
          result.classId._id,
          result.term,
          result.session,
          req.user.schoolId
        );
        console.log('[ReviewResult] Class positions recalculated');
      } catch (posErr) {
        console.error('[ReviewResult] Position calculation failed:', posErr);
      }

      return res.json({ 
        message: 'Result approved and verified successfully.',
        result 
      });
    } 
    
    else if (action === 'reject') {
      result.status = 'rejected';
      result.rejectionReason = rejectionReason || 'No reason provided';
      result.rejectedAt = new Date();
      result.rejectedBy = req.user._id;
      
      await result.save();

      console.log('[ReviewResult] Result rejected:', resultId);

      return res.json({ 
        message: 'Result rejected and sent back to teacher.',
        result 
      });
    } 
    
    else {
      return res.status(400).json({ 
        message: 'Invalid action. Use "approve", "verify", or "reject".' 
      });
    }

  } catch (err) {
    console.error('[ReviewResult Error]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// ✅ UPDATED: PUBLISH RESULT TO PARENT (NO SMS - Direct Dashboard Access)
export const sendResultToParent = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      schoolId: req.user.schoolId,
      status: 'approved'
    })
    .populate('student', 'name regNo parentPhone parentName parentId')
    .populate('classId', 'name');

    if (!result) {
      return res.status(404).json({ 
        message: 'Result not found or not approved.' 
      });
    }

    const student = result.student;
    const school = await School.findById(req.user.schoolId).select('name phone address');

    try {
      // Generate PDF as Base64
      console.log('[PublishResultToParent] Generating PDF...');
      const pdfResult = await generateResultPDFBase64(result, school);

      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF');
      }

      console.log('[PublishResultToParent] PDF generated, size:', pdfResult.size, 'bytes');

      // Store Base64 PDF in MongoDB
      result.pdfBase64 = pdfResult.base64;

      // ✅ Mark as sent (parent can now access via dashboard)
      result.status = 'sent';
      result.sentToParentAt = new Date();
      await result.save();

      // Create download link
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const downloadLink = `${baseUrl}/api/results/download/${result._id}`;

      const response = {
        message: 'Result published successfully!',
        pdfGenerated: true,
        pdfSize: pdfResult.size,
        downloadLink,
        studentName: student.name,
        parentAccess: student.parentId 
          ? '✅ Parent can now view in their dashboard' 
          : '⚠️ No parent account linked yet. Parent needs to register.'
      };

      console.log('[PublishResultToParent] Success:', response);

      res.json(response);

    } catch (error) {
      console.error('[PDF Error]', error);
      return res.status(500).json({ 
        message: 'Failed to generate result PDF.',
        error: error.message
      });
    }
  } catch (err) {
    console.error('[PublishResultToParent]', err);
    res.status(500).json({ message: 'Failed to publish result to parent.' });
  }
};

// ✅ UPDATED: PUBLISH MULTIPLE RESULTS TO PARENTS (NO SMS - Direct Dashboard Access)
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
    .populate('student', 'name regNo parentPhone parentName parentId')
    .populate('classId', 'name');

    if (results.length === 0) {
      return res.status(404).json({ message: 'No approved results found.' });
    }

    const school = await School.findById(req.user.schoolId).select('name phone address');
    
    const successfulPublishes = [];
    const failedPublishes = [];
    let parentsWithAccess = 0;
    let parentsWithoutAccess = 0;

    console.log(`[PublishMultipleResults] Processing ${results.length} results...`);
    
    for (const result of results) {
      const student = result.student;

      try {
        // Generate PDF as Base64
        const pdfResult = await generateResultPDFBase64(result, school);

        if (!pdfResult.success) {
          failedPublishes.push({
            studentName: student.name,
            reason: 'PDF generation failed'
          });
          continue;
        }

        // Store in MongoDB
        result.pdfBase64 = pdfResult.base64;
        result.status = 'sent';
        result.sentToParentAt = new Date();
        await result.save();

        successfulPublishes.push({
          studentName: student.name,
          resultId: result._id,
          hasParentAccount: !!student.parentId
        });

        // Count parent access status
        if (student.parentId) {
          parentsWithAccess++;
        } else {
          parentsWithoutAccess++;
        }

      } catch (pdfError) {
        console.error('[PDF Generation Error]', pdfError);
        failedPublishes.push({
          studentName: student.name,
          reason: 'PDF generation error: ' + pdfError.message
        });
      }
    }

    res.json({
      message: `Published ${successfulPublishes.length}/${results.length} results successfully!`,
      successCount: successfulPublishes.length,
      failureCount: failedPublishes.length,
      pdfsGenerated: successfulPublishes.length,
      parentsWithAccess,
      parentsWithoutAccess,
      accessSummary: parentsWithoutAccess > 0 
        ? `${parentsWithoutAccess} parent(s) need to register to view results.`
        : 'All parents can now view results in their dashboard!',
      failed: failedPublishes
    });
  } catch (err) {
    console.error('[PublishMultipleResults]', err);
    res.status(500).json({ message: 'Failed to publish results to parents.' });
  }
};

// ✅ DOWNLOAD RESULT PDF (PUBLIC ENDPOINT - No Auth Required)
export const downloadResultPDF = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      status: { $in: ['approved', 'sent'] }
    })
    .populate('student', 'name regNo')
    .populate('schoolId', 'name phone');

    if (!result) {
      return res.status(404).json({ message: 'Result not found or not available for download.' });
    }

    if (!result.schoolId || !result.schoolId._id) {
      console.error('[DownloadResultPDF] Missing schoolId for result:', resultId);
      return res.status(500).json({ 
        message: 'Result configuration error. Please contact the school.' 
      });
    }

    if (!result.student || !result.student._id) {
      console.error('[DownloadResultPDF] Missing student for result:', resultId);
      return res.status(500).json({ 
        message: 'Student information missing. Please contact the school.' 
      });
    }

    if (!result.pdfBase64) {
      return res.status(404).json({ 
        message: 'PDF not available. Please contact school to regenerate.',
        schoolContact: result.schoolId?.phone || 'N/A'
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
};

// ✅ GET ALL RESULTS (Admin Overview)
export const getAllResults = async (req, res) => {
  try {
    const { term, session, status, classId } = req.query;

    const query = { schoolId: req.user.schoolId };

    if (term) query.term = term;
    if (session) query.session = session;
    if (status) query.status = status;
    if (classId) query.classId = classId;

    const results = await Result.find(query)
      .populate('student', 'name regNo parentId')
      .populate('classId', 'name')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    res.json({ results });
  } catch (err) {
    console.error('[GetAllResults]', err);
    res.status(500).json({ message: 'Failed to fetch results.' });
  }
};