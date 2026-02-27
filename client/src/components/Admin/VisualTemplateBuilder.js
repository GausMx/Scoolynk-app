// src/components/Admin/VisualTemplateBuilder.js
// Simplified template builder — admin configures subjects list + term metadata.
// Preview renders a real NigerianResultSheet with sample data.

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, X, Eye, EyeOff, GripVertical } from 'lucide-react';
import axios from 'axios';
import Loading from '../common/Loading';
import NigerianResultSheet from '../common/NigerianResultSheet';

const { REACT_APP_API_URL } = process.env;

// ─── Default subjects for a new template ─────────────────────────────────────
const DEFAULT_SUBJECTS = [
  'English Language', 'Mathematics', 'Basic Science', 'Social Studies',
  'Civic Education', 'Agricultural Science', 'Home Economics',
  'Physical & Health Education', 'Fine Arts', 'Computer Studies',
  'Islamic Religious Studies', 'Hausa Language',
];

// ─── Sample data for the live preview ────────────────────────────────────────
const PREVIEW_STUDENT = {
  name: 'Aisha Musa Ibrahim',
  admNo: 'AQA/2024/001',
  regNo: 'AQA/2024/001',
  gender: 'Female',
  dob: '12-Mar-2012',
  className: 'JSS 1A',
  club: 'Science Club',
  passportBase64: null,
};

const PREVIEW_RESULT = {
  term: 'Third Term',
  session: '2023/2024',
  attendance: { opened: 87, present: 82, absent: 5 },
  comments: {
    teacher: 'Aisha has shown remarkable dedication and improvement this term.',
    principal: 'An outstanding student. Keep it up!',
  },
  overallPosition: 3,
  overallAverage: 78,
  affectiveTraits: {
    attentiveness: 5, honesty: 4, neatness: 5, politeness: 4,
    punctuality: 4, selfControl: 3, obedience: 4, reliability: 4,
    responsibility: 5, relationship: 4,
    handlingOfTools: 3, drawingPainting: 3, handwriting: 4,
    publicSpeaking: 3, speechFluency: 4, sportsGames: 5,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
const VisualTemplateBuilder = ({
  schoolId,
  token: propToken,
  onClose,
  existingTemplate = null,
}) => {
  const token = propToken || localStorage.getItem('accessToken');
  const authHeader = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;

  // ── Loading ──────────────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(true);
  const [loadingPct,    setLoadingPct]    = useState(0);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [showPreview,   setShowPreview]   = useState(false);

  // ── School branding (for preview) ────────────────────────────────────────────
  const [school, setSchool] = useState({
    name: '', address: '', phone: '', email: '', motto: '', logoBase64: '', principalName: '',
  });

  // ── Template config fields ────────────────────────────────────────────────────
  const [templateName, setTemplateName] = useState(existingTemplate?.name    || '');
  const [term,         setTerm]         = useState(existingTemplate?.term    || 'Third Term');
  const [session,      setSession]      = useState(existingTemplate?.session || '');
  const [termBegins,   setTermBegins]   = useState(existingTemplate?.components?.termBegins   || '');
  const [termEnds,     setTermEnds]     = useState(existingTemplate?.components?.termEnds     || '');
  const [nextTerm,     setNextTerm]     = useState(existingTemplate?.components?.nextTermBegins|| '');
  const [classSize,    setClassSize]    = useState(existingTemplate?.components?.classSize    || '');

  // ── Subjects list ─────────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState(() => {
    const saved = existingTemplate?.components?.subjects;
    if (Array.isArray(saved) && saved.length) {
      return saved.map(s => (typeof s === 'string' ? s : s.name || s.subject || ''));
    }
    return [...DEFAULT_SUBJECTS];
  });

  const [newSubjectName, setNewSubjectName] = useState('');
  const [dragIdx, setDragIdx] = useState(null);

  // ── Fetch school branding ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setLoadingPct(20);
        const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
          headers: { Authorization: authHeader },
        });
        setLoadingPct(80);
        const s = res.data.school || {};
        setSchool({
          name:          s.name          || '',
          address:       s.address       || '',
          phone:         s.phone         || '',
          email:         s.email         || '',
          motto:         s.motto         || '',
          logoBase64:    s.logoBase64    || '',
          principalName: s.principalName || '',
        });
        setLoadingPct(100);
      } catch (err) {
        console.error('[TemplateBuilder] Failed to fetch school:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetch();
    else setLoading(false);
  }, [token]);

  // ── Subject CRUD ──────────────────────────────────────────────────────────────
  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    if (subjects.includes(name)) { setError(`"${name}" is already in the list.`); return; }
    setSubjects(prev => [...prev, name]);
    setNewSubjectName('');
    setError('');
  };

  const removeSubject = (idx) => setSubjects(prev => prev.filter((_, i) => i !== idx));

  const updateSubject = (idx, val) =>
    setSubjects(prev => prev.map((s, i) => i === idx ? val : s));

  // ── Drag-to-reorder ───────────────────────────────────────────────────────────
  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver  = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...subjects];
    const [moved]   = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setSubjects(reordered);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError('');
    if (!templateName.trim()) { setError('Please enter a template name.'); return; }
    if (!term)                 { setError('Please select a term.'); return; }
    if (!session.trim())       { setError('Please enter the session e.g. 2024/2025.'); return; }
    if (!subjects.filter(s => s.trim()).length) {
      setError('Please add at least one subject.'); return;
    }

    const templateData = {
      name:     templateName.trim(),
      term,
      session:  session.trim(),
      schoolId: schoolId || undefined,
      components: {
        subjects:      subjects.filter(s => s.trim()),
        termBegins:    termBegins  || undefined,
        termEnds:      termEnds    || undefined,
        nextTermBegins: nextTerm   || undefined,
        classSize:     classSize   ? Number(classSize) : undefined,
        // Keep legacy structure so existing result-entry code that reads
        // components.scoresTable.subjects still works
        scoresTable: {
          enabled:  true,
          subjects: subjects.filter(s => s.trim()).map(name => ({ name })),
          defaultSubjects: subjects.filter(s => s.trim()).length,
          columns: [
            { name: 'CA',    maxScore: 40,  enabled: true, editable: true },
            { name: 'Exam',  maxScore: 60,  enabled: true, editable: true },
            { name: 'Total', maxScore: 100, enabled: true, editable: false, calculated: true },
            { name: 'Grade', maxScore: 0,   enabled: true, editable: false, calculated: true },
          ],
        },
        affectiveTraits: { enabled: true },
        attendance:      { enabled: true },
        comments:        { enabled: true, teacher: true, principal: true },
      },
    };

    try {
      setSaving(true);
      const url    = existingTemplate
        ? `${REACT_APP_API_URL}/api/admin/templates/${existingTemplate._id}`
        : `${REACT_APP_API_URL}/api/admin/templates`;
      const method = existingTemplate ? 'put' : 'post';

      await axios[method](url, templateData, {
        headers: { Authorization: authHeader },
      });

      // Propagate term/session to the school record so all teachers
      // automatically use this term without any manual selection.
      // Non-fatal: if this fails (e.g. network blip), template is already saved.
      try {
        await axios.put(
          `${REACT_APP_API_URL}/api/admin/settings`,
          { section: 'term', data: { currentTerm: term, currentSession: session.trim() } },
          { headers: { Authorization: authHeader } }
        );
      } catch (settingsErr) {
        console.warn('[TemplateBuilder] Could not update active term on school — template saved OK:', settingsErr?.response?.data?.message || settingsErr.message);
      }

      if (onClose) onClose();
    } catch (err) {
      console.error('[TemplateBuilder] Save error:', err);
      const msg = err.response?.data?.message || '';
      if (msg.includes('already exists')) {
        setError(msg + ' You can edit the existing template from the templates list.');
      } else {
        setError(msg || 'Failed to save template. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Build preview result with current subjects ────────────────────────────────
  const previewSubjects = subjects.filter(s => s.trim()).slice(0, 8).map((name, i) => {
    const ca   = 28 + (i % 7);
    const exam = 44 + (i % 11);
    const total = ca + exam;
    return { subject: name, ca, exam, total };
  });

  const previewResult = {
    ...PREVIEW_RESULT,
    term,
    session: session || '2024/2025',
    subjects: previewSubjects,
  };

  if (loading) return <Loading percentage={loadingPct} />;

  return (
    <div className="container-fluid py-3" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>

      {/* ── Header bar ────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-0 fs-5">
            {existingTemplate ? '✏️ Edit' : '➕ Create'} Result Template
          </h4>
          <small className="text-muted">
            Define subjects for {term || '—'} · {session || '—'}
          </small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible py-2">
          {error}
          <button type="button" className="btn-close btn-sm" onClick={() => setError('')} />
        </div>
      )}

      {/* ── Branding warning if logo missing ─────────────────────────────────── */}
      {!school.logoBase64 && (
        <div className="alert alert-warning py-2 d-flex align-items-center gap-2">
          ⚠️ <span>No school logo found. <a href="/admin/settings" target="_blank" rel="noreferrer">Upload one in Settings → Branding</a> so it appears on result sheets.</span>
        </div>
      )}

      <div className="row g-3">

        {/* ═══════════════════════ LEFT: Config Panel ═══════════════════════════ */}
        <div className={showPreview ? 'col-12 col-xl-5' : 'col-12 col-lg-8 col-xl-6 mx-auto'}>

          {/* ── Basic info ──────────────────────────────────────────────────── */}
          <div className="card mb-3">
            <div className="card-header fw-bold py-2 bg-primary text-white">Template Info</div>
            <div className="card-body p-3">
              <div className="row g-2">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Template Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="e.g. JSS 1 Third Term 2024/2025"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Term *</label>
                  <select className="form-select form-select-sm" value={term} onChange={e => setTerm(e.target.value)}>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Session *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={session}
                    onChange={e => setSession(e.target.value)}
                    placeholder="2024/2025"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Term dates (default dates shown on result sheets) ───────────── */}
          <div className="card mb-3">
            <div className="card-header fw-bold py-2">
              📅 Term Dates
              <small className="text-muted fw-normal ms-2">— defaults shown on result sheets</small>
            </div>
            <div className="card-body p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold">Term Begins</label>
                  <input type="date" className="form-control form-control-sm" value={termBegins} onChange={e => setTermBegins(e.target.value)} />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold">Term Ends</label>
                  <input type="date" className="form-control form-control-sm" value={termEnds} onChange={e => setTermEnds(e.target.value)} />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold">Next Term Begins</label>
                  <input type="date" className="form-control form-control-sm" value={nextTerm} onChange={e => setNextTerm(e.target.value)} />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold">Default Class Size</label>
                  <input type="number" min={1} className="form-control form-control-sm" value={classSize} onChange={e => setClassSize(e.target.value)} placeholder="e.g. 35" />
                  <small className="text-muted">Teacher can adjust per student</small>
                </div>
              </div>
            </div>
          </div>

          {/* ── Subjects list ────────────────────────────────────────────────── */}
          <div className="card mb-3">
            <div className="card-header fw-bold py-2 d-flex justify-content-between align-items-center">
              <span>📚 Subjects List <span className="badge bg-secondary ms-1">{subjects.filter(s => s.trim()).length}</span></span>
              <small className="text-muted fw-normal">Drag to reorder</small>
            </div>
            <div className="card-body p-2">

              {/* Add subject input */}
              <div className="input-group input-group-sm mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type subject name and press Add"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubject()}
                />
                <button className="btn btn-primary" type="button" onClick={addSubject}>
                  <Plus size={14} className="me-1" />Add
                </button>
              </div>

              {/* Subject rows */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {subjects.map((subj, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="d-flex align-items-center gap-2 mb-1 p-1 rounded"
                    style={{
                      backgroundColor: dragIdx === idx ? '#e0f2fe' : idx % 2 === 0 ? '#f8f9fa' : '#fff',
                      border: '1px solid #e2e8f0',
                      cursor: 'grab',
                    }}
                  >
                    <GripVertical size={14} className="text-muted flex-shrink-0" />
                    <span className="text-muted small flex-shrink-0" style={{ width: '20px' }}>{idx + 1}.</span>
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-transparent p-0"
                      value={subj}
                      onChange={e => updateSubject(idx, e.target.value)}
                      style={{ fontWeight: '500' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger border-0 p-1 flex-shrink-0"
                      onClick={() => removeSubject(idx)}
                      title="Remove subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {subjects.length === 0 && (
                <div className="text-center text-muted py-3">
                  No subjects added yet. Type above to add.
                </div>
              )}
            </div>
          </div>

          {/* ── Info note about what else is on the sheet ─────────────────── */}
          <div className="card mb-3 border-info">
            <div className="card-body p-3 bg-info bg-opacity-10">
              <p className="mb-1 small fw-semibold">ℹ️ What's automatically included on every result sheet:</p>
              <ul className="mb-0 small text-muted">
                <li>School logo, name, motto and address (from Settings → Branding)</li>
                <li>Student's personal data and passport photo</li>
                <li>CA (40) + Exam (60) = Total (100) columns</li>
                <li>All 10 affective domain traits</li>
                <li>All 6 psychomotor skills</li>
                <li>Grade scale legend and rating indices</li>
                <li>Teacher and principal comment sections</li>
              </ul>
            </div>
          </div>

          {/* ── Buttons ──────────────────────────────────────────────────────── */}
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary flex-grow-1"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff size={15} className="me-1" /> : <Eye size={15} className="me-1" />}
              {showPreview ? 'Hide Preview' : 'Preview Sheet'}
            </button>
            <button
              type="button"
              className="btn btn-success flex-grow-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                : <><Save size={15} className="me-1" />Save Template</>
              }
            </button>
          </div>
        </div>

        {/* ═══════════════════════ RIGHT: Live Preview ══════════════════════════ */}
        {showPreview && (
          <div className="col-12 col-xl-7">
            <div className="card">
              <div className="card-header bg-dark text-white py-2 d-flex justify-content-between">
                <span className="fw-bold">📄 Live Preview — actual result sheet</span>
                <small className="text-muted">(Sample data — your school branding)</small>
              </div>
              <div className="card-body p-2" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '85vh' }}>
                <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '139%' }}>
                  <NigerianResultSheet
                    result={previewResult}
                    school={school}
                    student={PREVIEW_STUDENT}
                    classSize={classSize ? Number(classSize) : 35}
                    termBegins={termBegins}
                    termEnds={termEnds}
                    nextTermBegins={nextTerm}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* end row */}
    </div>
  );
};

export default VisualTemplateBuilder;