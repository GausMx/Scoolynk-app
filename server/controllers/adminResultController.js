// server/controllers/adminResultController.js

import Result from '../models/Result.js'; 
import ResultTemplate from '../models/ResultTemplate.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import { generateResultPDFBase64 } from '../services/pdfResultService.js';

// ─── School branding fields needed by pdfResultService ───────────────────────
// Used in every place we call generateResultPDFBase64()
const SCHOOL_BRANDING_SELECT = 'name address phone email motto logoBase64 principalName';

// ─── Templates ────────────────────────────────────────────────────────────────

export const createResultTemplate = async (req, res) => {
  try {
    const { name, term, session, schoolId, components } = req.body;
    if (!name || !term || !session || !components)
      return res.status(400).json({ message: 'Name, term, session, and components are required.' });

    const existing = await ResultTemplate.findOne({
      schoolId: schoolId || req.user.schoolId, term, session, isActive: true,
    });
    if (existing)
      return res.status(400).json({ message: `A template already exists for ${term}, ${session}. Please edit or deactivate it first.` });

    const template = await new ResultTemplate({
      schoolId: schoolId || req.user.schoolId,
      name, term, session, templateType: 'visual', components,
      createdBy: req.user._id, isActive: true,
    }).save();

    res.status(201).json({ message: 'Result template created successfully.', template });
  } catch (err) {
    console.error('[CreateResultTemplate]', err);
    res.status(500).json({ message: 'Failed to create template.', error: err.message });
  }
};

export const updateResultTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, term, session, components, isActive } = req.body;

    const template = await ResultTemplate.findOne({ _id: id, schoolId: req.user.schoolId });
    if (!template) return res.status(404).json({ message: 'Template not found.' });

    if (name      !== undefined) template.name       = name;
    if (term      !== undefined) template.term       = term;
    if (session   !== undefined) template.session    = session;
    if (components!== undefined) template.components = components;
    if (isActive  !== undefined) template.isActive   = isActive;
    await template.save();

    res.json({ message: 'Template updated successfully.', template });
  } catch (err) {
    console.error('[UpdateResultTemplate]', err);
    res.status(500).json({ message: 'Failed to update template.' });
  }
};

export const getResultTemplates = async (req, res) => {
  try {
    const { term, session, isActive } = req.query;
    const query = { schoolId: req.user.schoolId };
    if (term     ) query.term     = term;
    if (session  ) query.session  = session;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await ResultTemplate.find(query)
      .populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ templates });
  } catch (err) {
    console.error('[GetResultTemplates]', err);
    res.status(500).json({ message: 'Failed to fetch templates.' });
  }
};

export const getResultTemplate = async (req, res) => {
  try {
    const template = await ResultTemplate.findOne({ _id: req.params.id, schoolId: req.user.schoolId })
      .populate('createdBy', 'name email');
    if (!template) return res.status(404).json({ message: 'Template not found.' });
    res.json({ template });
  } catch (err) {
    console.error('[GetResultTemplate]', err);
    res.status(500).json({ message: 'Failed to fetch template.' });
  }
};

export const deleteResultTemplate = async (req, res) => {
  try {
    const template = await ResultTemplate.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!template) return res.status(404).json({ message: 'Template not found.' });

    if (template.isActive) {
      template.isActive = false;
      await template.save();
      return res.json({ message: 'Template deactivated successfully.', deactivated: true });
    }

    await ResultTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template permanently deleted.', deleted: true });
  } catch (err) {
    console.error('[DeleteResultTemplate]', err);
    res.status(500).json({ message: 'Failed to delete template.' });
  }
};

export const duplicateResultTemplate = async (req, res) => {
  try {
    const { newTerm, newSession, newName } = req.body;
    if (!newTerm || !newSession)
      return res.status(400).json({ message: 'New term and session are required.' });

    const original = await ResultTemplate.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!original) return res.status(404).json({ message: 'Original template not found.' });

    const existing = await ResultTemplate.findOne({ schoolId: req.user.schoolId, term: newTerm, session: newSession, isActive: true });
    if (existing)
      return res.status(400).json({ message: `A template already exists for ${newTerm}, ${newSession}.` });

    const newTemplate = await new ResultTemplate({
      schoolId:     original.schoolId,
      name:         newName || `${original.name} (${newTerm} - ${newSession})`,
      term:         newTerm,
      session:      newSession,
      templateType: original.templateType,
      components:   original.components,
      createdBy:    req.user._id,
      isActive:     true,
    }).save();

    res.status(201).json({ message: 'Template duplicated successfully.', template: newTemplate });
  } catch (err) {
    console.error('[DuplicateResultTemplate]', err);
    res.status(500).json({ message: 'Failed to duplicate template.' });
  }
};

// ─── Results ──────────────────────────────────────────────────────────────────

export const getSubmittedResults = async (req, res) => {
  try {
    const { term, session, classId } = req.query;
    const query = { schoolId: req.user.schoolId, status: 'submitted' };
    if (term   ) query.term    = term;
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

export const reviewResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { action, comments, rejectionReason } = req.body;

    const result = await Result.findById(resultId)
      .populate('student').populate('classId', 'name');
    if (!result) return res.status(404).json({ message: 'Result not found.' });

    if (String(result.student.schoolId) !== String(req.user.schoolId))
      return res.status(403).json({ message: 'Not authorized for this school.' });

    if (action === 'approve' || action === 'verify') {
      result.status     = 'approved';
      result.approvedAt = new Date();
      result.approvedBy = req.user._id;
      if (comments) result.comments = {
        teacher:   comments.teacher   || result.comments?.teacher   || '',
        principal: comments.principal || result.comments?.principal || '',
      };
      await result.save();

      // Recalculate class positions
      try {
        await Result.calculateClassPositions(result.classId._id, result.term, result.session, req.user.schoolId);
      } catch (posErr) {
        console.error('[ReviewResult] Position recalc failed:', posErr);
      }

      return res.json({ message: 'Result approved successfully.', result });
    }

    if (action === 'reject') {
      result.status          = 'rejected';
      result.rejectionReason = rejectionReason || 'No reason provided';
      result.rejectedAt      = new Date();
      result.rejectedBy      = req.user._id;
      await result.save();
      return res.json({ message: 'Result rejected and sent back to teacher.', result });
    }

    return res.status(400).json({ message: 'Invalid action. Use "approve", "verify", or "reject".' });
  } catch (err) {
    console.error('[ReviewResult]', err);
    res.status(500).json({ message: 'Failed to review result.' });
  }
};

// ✅ FIX 3: School fetched with ALL branding fields so logo/motto/address appear on PDF
export const sendResultToParent = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      schoolId: req.user.schoolId,
      status: 'approved',
    })
    .populate('student',  'name regNo parentPhone parentName parentId gender dob passportBase64 club')
    .populate('classId',  'name')
    .populate('teacher',  'name');

    if (!result)
      return res.status(404).json({ message: 'Result not found or not approved.' });

    // ✅ Fetch school with ALL fields pdfResultService needs
    const school = await School.findById(req.user.schoolId).select(SCHOOL_BRANDING_SELECT);
    if (!school)
      return res.status(404).json({ message: 'School not found.' });

    console.log('[PublishResult] Generating PDF for:', result.student.name);
    console.log('[PublishResult] School logo present:', !!school.logoBase64);

    const pdfResult = await generateResultPDFBase64(result, school);
    if (!pdfResult.success) throw new Error('PDF generation returned failure');

    result.pdfBase64      = pdfResult.base64;
    result.status         = 'sent';
    result.sentToParentAt = new Date();
    await result.save();

    const baseUrl      = process.env.APP_URL || 'http://localhost:5000';
    const downloadLink = `${baseUrl}/api/results/download/${result._id}`;

    res.json({
      message:      'Result published successfully!',
      pdfGenerated: true,
      pdfSize:      pdfResult.size,
      downloadLink,
      studentName:  result.student.name,
      parentAccess: result.student.parentId
        ? '✅ Parent can now view in their dashboard'
        : '⚠️ No parent account linked yet.',
    });
  } catch (err) {
    console.error('[PublishResult]', err);
    res.status(500).json({ message: 'Failed to publish result.', error: err.message });
  }
};

// ✅ FIX 3 (batch): same fix — fetch school once with all branding fields
export const sendMultipleResultsToParents = async (req, res) => {
  try {
    const { resultIds } = req.body;
    if (!Array.isArray(resultIds) || resultIds.length === 0)
      return res.status(400).json({ message: 'Result IDs array is required.' });

    const results = await Result.find({
      _id: { $in: resultIds },
      schoolId: req.user.schoolId,
      status: 'approved',
    })
    .populate('student', 'name regNo parentPhone parentName parentId gender dob passportBase64 club')
    .populate('classId', 'name')
    .populate('teacher', 'name');

    if (results.length === 0)
      return res.status(404).json({ message: 'No approved results found.' });

    // ✅ Fetch school ONCE with all branding fields
    const school = await School.findById(req.user.schoolId).select(SCHOOL_BRANDING_SELECT);
    if (!school) return res.status(404).json({ message: 'School not found.' });

    console.log(`[PublishMultiple] Processing ${results.length} results. Logo present: ${!!school.logoBase64}`);

    const successfulPublishes = [];
    const failedPublishes     = [];
    let parentsWithAccess    = 0;
    let parentsWithoutAccess = 0;

    for (const result of results) {
      try {
        const pdfResult = await generateResultPDFBase64(result, school);
        if (!pdfResult.success) throw new Error('PDF generation returned failure');

        result.pdfBase64      = pdfResult.base64;
        result.status         = 'sent';
        result.sentToParentAt = new Date();
        await result.save();

        successfulPublishes.push({ studentName: result.student.name, resultId: result._id, hasParentAccount: !!result.student.parentId });
        result.student.parentId ? parentsWithAccess++ : parentsWithoutAccess++;
      } catch (pdfError) {
        console.error('[PDF Error] Student:', result.student.name, pdfError.message);
        failedPublishes.push({ studentName: result.student.name, reason: pdfError.message });
      }
    }

    res.json({
      message:             `Published ${successfulPublishes.length}/${results.length} results successfully!`,
      successCount:        successfulPublishes.length,
      failureCount:        failedPublishes.length,
      pdfsGenerated:       successfulPublishes.length,
      parentsWithAccess,
      parentsWithoutAccess,
      accessSummary:       parentsWithoutAccess > 0
        ? `${parentsWithoutAccess} parent(s) need to register to view results.`
        : 'All parents can now view results in their dashboard!',
      failed: failedPublishes,
    });
  } catch (err) {
    console.error('[PublishMultiple]', err);
    res.status(500).json({ message: 'Failed to publish results.', error: err.message });
  }
};

// ─── Download PDF ─────────────────────────────────────────────────────────────

export const downloadResultPDF = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findOne({
      _id: resultId,
      status: { $in: ['approved', 'sent'] },
    })
    .populate('student', 'name regNo')
    .populate('schoolId', 'name phone');

    if (!result)
      return res.status(404).json({ message: 'Result not found or not available for download.' });

    if (!result.pdfBase64)
      return res.status(404).json({ message: 'PDF not yet generated. Please contact the school.', schoolContact: result.schoolId?.phone || 'N/A' });

    const pdfBuffer = Buffer.from(result.pdfBase64, 'base64');
    const filename  = `Result_${result.student.regNo}_${result.term.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',       pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[DownloadResultPDF]', err);
    res.status(500).json({ message: 'Failed to download result PDF.' });
  }
};

// ─── All Results (Admin Overview) ─────────────────────────────────────────────

export const getAllResults = async (req, res) => {
  try {
    const { term, session, status, classId } = req.query;
    const query = { schoolId: req.user.schoolId };
    if (term   ) query.term    = term;
    if (session) query.session = session;
    if (status ) query.status  = status;
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