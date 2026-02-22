// src/components/Teacher/VisualResultEntry.js

import React, { useState, useEffect } from 'react';
import { Save, Send, Plus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

// ─── Maps template trait display names → schema camelCase keys ───────────────
// Handles all variations an admin might type in the VisualTemplateBuilder
const TRAIT_KEY_MAP = {
  // Affective Domain
  'attentiveness':           'attentiveness',
  'honesty':                 'honesty',
  'neatness':                'neatness',
  'politeness':              'politeness',
  'punctuality':             'punctuality',
  'punctuality/assembly':    'punctuality',
  'selfcontrol':             'selfControl',
  'selfcontrol/calmness':    'selfControl',
  'self-control':            'selfControl',
  'self-control/calmness':   'selfControl',
  'obedience':               'obedience',
  'reliability':             'reliability',
  'responsibility':          'responsibility',
  'senseofresponsibility':   'responsibility',
  'senseof responsibility':  'responsibility',
  'relationship':            'relationship',
  'relationshipwithothers':  'relationship',
  'relationship with others':'relationship',
  // Psychomotor Domain
  'handlingoftools':         'handlingOfTools',
  'handling of tools':       'handlingOfTools',
  'drawing/painting':        'drawingPainting',
  'drawingpainting':         'drawingPainting',
  'drawing painting':        'drawingPainting',
  'handwriting':             'handwriting',
  'publicspeaking':          'publicSpeaking',
  'public speaking':         'publicSpeaking',
  'speechfluency':           'speechFluency',
  'speech fluency':          'speechFluency',
  'sports&games':            'sportsGames',
  'sports & games':          'sportsGames',
  'sportsgames':             'sportsGames',
  'sports and games':        'sportsGames',
};

/** Convert a trait display name to its schema key */
const resolveTraitKey = (name) => {
  const raw = name.toLowerCase().replace(/\s+/g, '');
  return TRAIT_KEY_MAP[raw] || TRAIT_KEY_MAP[name.toLowerCase()] || raw;
};

// ─── Nigerian grade scale (matches Result.js pre-save hook) ──────────────────
const calculateGrade = (total) => {
  if (total >= 95) return 'A+';
  if (total >= 90) return 'A';
  if (total >= 85) return 'A-';
  if (total >= 80) return 'B+';
  if (total >= 75) return 'B';
  if (total >= 70) return 'B-';
  if (total >= 60) return 'C';
  if (total >= 40) return 'D';
  return 'F';
};

// ─── Component ────────────────────────────────────────────────────────────────
const VisualResultEntry = ({
  student,
  template,
  existingResult = null,
  term,
  session,
  token,
  onClose,
  onSuccess,
}) => {
  const [subjects,        setSubjects]        = useState([]);
  const [affectiveTraits, setAffectiveTraits] = useState({});
  const [fees,            setFees]            = useState({});
  const [attendance,      setAttendance]      = useState({ opened: 0, present: 0, absent: 0 });
  const [comments,        setComments]        = useState({ teacher: '', principal: '' });
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  // ── Token check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
    }
  }, [token]);

  // ── Initialise form from existingResult or template ──────────────────────────
  useEffect(() => {
    if (existingResult) {
      setSubjects(existingResult.subjects || []);
      setAffectiveTraits(existingResult.affectiveTraits || {});
      setFees(existingResult.fees || {});
      setAttendance(existingResult.attendance || { opened: 0, present: 0, absent: 0 });
      setComments(existingResult.comments || { teacher: '', principal: '' });
      return;
    }

    if (!template) return;

    const templateSubjects = template.components?.scoresTable?.subjects || [];
    const scoreColumns     = template.components?.scoresTable?.columns  || [];

    // Build empty subject rows
    const buildSubjectRow = (name = '') => {
      const row = { subject: name };
      scoreColumns.forEach(col => {
        if (col.editable) {
          // Map "C.A." / "CA" → "ca"; everything else lowercased, no spaces
          const key = normaliseColumnKey(col.name);
          row[key] = 0;
        }
      });
      return row;
    };

    const defaultSubjects = templateSubjects.length > 0
      ? templateSubjects.map(s => buildSubjectRow(s.subject || s.name || ''))
      : Array.from(
          { length: template.components?.scoresTable?.defaultSubjects || 12 },
          (_, i) => buildSubjectRow(`Subject ${i + 1}`)
        );

    setSubjects(defaultSubjects);

    // Affective traits — use TRAIT_KEY_MAP for all keys
    const traitsInit = {};
    (template.components?.affectiveTraits?.traits || []).forEach(trait => {
      const key = resolveTraitKey(trait.name);
      traitsInit[key] = trait.defaultValue ?? 3;
    });
    setAffectiveTraits(traitsInit);

    // Fees
    const feesInit = {};
    (template.components?.fees?.types || []).forEach(fee => {
      const key = fee.name.toLowerCase().replace(/\s+/g, '');
      feesInit[key] = fee.defaultValue ?? 0;
    });
    setFees(feesInit);

    setAttendance(
      template.components?.attendance?.defaultValues || { opened: 0, present: 0, absent: 0 }
    );
    setComments({ teacher: '', principal: '' });

  }, [existingResult, template]);

  // ── Column key normalisation ─────────────────────────────────────────────────
  // "C.A." and "CA" both map to "ca"; "Exam" → "exam"; etc.
  const normaliseColumnKey = (name) => {
    const stripped = name.toLowerCase().replace(/[.\s]/g, '');
    if (stripped === 'ca' || stripped === 'ca1' || stripped === 'ca2') return stripped;
    return stripped;
  };

  // ── Calculate live total from editable columns ───────────────────────────────
  const calculateTotal = (subject) => {
    let total = 0;
    (template?.components?.scoresTable?.columns || []).forEach(col => {
      if (col.editable) {
        const key = normaliseColumnKey(col.name);
        total += Number(subject[key]) || 0;
      }
    });
    return total;
  };

  // ── Subject CRUD ─────────────────────────────────────────────────────────────
  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const addSubjectRow = () => {
    const row = { subject: '' };
    (template?.components?.scoresTable?.columns || []).forEach(col => {
      if (col.editable) row[normaliseColumnKey(col.name)] = 0;
    });
    setSubjects(prev => [...prev, row]);
  };

  const removeSubjectRow = (index) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
  };

  // ── Save / Submit ────────────────────────────────────────────────────────────
  const handleSave = async (submitToAdmin = false) => {
    setError('');

    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      return;
    }

    const validSubjects = subjects.filter(s => s.subject?.trim());
    if (validSubjects.length === 0) {
      setError('Please add at least one subject with scores.');
      return;
    }

    // Normalise subjects: ensure both ca (new) and legacy ca1/ca2 are handled
    const normalisedSubjects = validSubjects.map(s => {
      // If template uses a single "CA" column (max 40), map it to `ca`
      // If template uses "CA1" + "CA2" columns (max 20 each), keep as-is
      const hasSingleCA = 'ca' in s;
      const hasLegacyCA = 'ca1' in s || 'ca2' in s;
      return {
        ...s,
        // Always send `ca` so the model pre-save hook can pick it up cleanly
        ca: hasSingleCA ? s.ca : (s.ca1 || 0) + (s.ca2 || 0),
      };
    });

    const payload = {
      studentId: student._id,
      term,
      session,
      subjects: normalisedSubjects,
      affectiveTraits,
      fees,
      attendance,
      comments,
      status: submitToAdmin ? 'submitted' : 'draft',
    };

    if (existingResult) payload.resultId = existingResult._id;

    try {
      setLoading(true);
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/results`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error('[VisualResultEntry]', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => { window.location.href = '/login'; }, 3000);
      } else {
        setError(err.response?.data?.message || 'Failed to save result.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Guard: no template ───────────────────────────────────────────────────────
  if (!template) {
    return (
      <div className="alert alert-warning d-flex align-items-center">
        <AlertCircle size={20} className="me-2" />
        No template found for {term}, {session}. Please ask your admin to create one.
      </div>
    );
  }

  const components  = template.components || {};
  const scoreColumns = components.scoresTable?.columns || [];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">

          {/* ── Modal Header ─────────────────────────────────────────────────── */}
          <div className="modal-header">
            <div>
              <h5 className="modal-title">Result Entry — {student?.name}</h5>
              <small className="text-muted">
                {term}, {session} &nbsp;|&nbsp; Template: {template.name}
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* ── Modal Body ───────────────────────────────────────────────────── */}
          <div className="modal-body">

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* School / Student Header */}
            {components.header?.enabled && (
              <div className="text-center mb-3 pb-3 border-bottom">
                <h5 className="fw-bold mb-1">{template.schoolId?.name || 'SCHOOL NAME'}</h5>
                <small className="text-muted">{template.schoolId?.address}</small>
                <div className="mt-1 fw-semibold">{term} Report Card — {session}</div>
              </div>
            )}

            {components.studentInfo?.enabled && (
              <div className="row mb-4 g-2">
                <div className="col-md-6"><strong>Name:</strong> {student.name}</div>
                <div className="col-md-6"><strong>Reg No:</strong> {student.regNo}</div>
                <div className="col-md-6"><strong>Class:</strong> {student.classId?.name}</div>
                <div className="col-md-6"><strong>Session:</strong> {session}</div>
              </div>
            )}

            {/* ── Scores Table ─────────────────────────────────────────────── */}
            {components.scoresTable?.enabled && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Academic Performance</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={addSubjectRow}
                  >
                    <Plus size={14} className="me-1" />
                    Add Subject
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: '160px' }}>Subject</th>
                        {scoreColumns.filter(c => c.enabled).map((col, i) => (
                          <th key={i} className="text-center" style={{ minWidth: '72px' }}>
                            {col.name}
                            {col.maxScore > 0 && (
                              <small className="d-block text-muted fw-normal">/{col.maxScore}</small>
                            )}
                          </th>
                        ))}
                        <th style={{ width: '44px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, idx) => {
                        const total = calculateTotal(subject);
                        const grade = calculateGrade(total);

                        return (
                          <tr key={idx}>
                            {/* Subject name */}
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={subject.subject}
                                onChange={e => updateSubject(idx, 'subject', e.target.value)}
                                placeholder={`Subject ${idx + 1}`}
                              />
                            </td>

                            {/* Score columns */}
                            {scoreColumns.filter(c => c.enabled).map((col, colIdx) => {
                              if (col.calculated) {
                                if (col.name.toLowerCase().includes('total')) {
                                  return (
                                    <td key={colIdx} className="text-center fw-bold">
                                      {total}
                                    </td>
                                  );
                                }
                                if (col.name.toLowerCase().includes('grade')) {
                                  return (
                                    <td key={colIdx} className="text-center fw-bold">
                                      {grade}
                                    </td>
                                  );
                                }
                                return <td key={colIdx} className="text-center text-muted">—</td>;
                              }

                              const fieldKey = normaliseColumnKey(col.name);
                              return (
                                <td key={colIdx}>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    value={subject[fieldKey] ?? 0}
                                    onChange={e =>
                                      updateSubject(
                                        idx,
                                        fieldKey,
                                        Math.min(col.maxScore, Math.max(0, Number(e.target.value)))
                                      )
                                    }
                                    min="0"
                                    max={col.maxScore}
                                  />
                                </td>
                              );
                            })}

                            {/* Remove row */}
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger p-1"
                                onClick={() => removeSubjectRow(idx)}
                                title="Remove subject"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Affective Traits ──────────────────────────────────────────── */}
            {components.affectiveTraits?.enabled && (
              <div className="mb-4">
                <h6 className="fw-bold mb-3">
                  Affective &amp; Psychomotor Traits
                  <small className="text-muted fw-normal ms-2">(Rate 1–5)</small>
                </h6>
                <div className="row g-2">
                  {(components.affectiveTraits.traits || []).map((trait, i) => {
                    const key = resolveTraitKey(trait.name);
                    const val = affectiveTraits[key] ?? 3;
                    return (
                      <div key={i} className="col-12 col-sm-6 col-lg-4">
                        <div className="input-group input-group-sm">
                          <span
                            className="input-group-text text-start"
                            style={{ minWidth: '160px', fontSize: '12px' }}
                          >
                            {trait.name}
                          </span>
                          {/* Visual 1–5 button selector */}
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              type="button"
                              className={`btn btn-sm ${
                                val === n ? 'btn-primary' : 'btn-outline-secondary'
                              }`}
                              style={{ width: '32px', padding: '0' }}
                              onClick={() =>
                                setAffectiveTraits(prev => ({ ...prev, [key]: n }))
                              }
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <small className="text-muted d-block mt-2">
                  5 = Excellent &nbsp;|&nbsp; 4 = Very Good &nbsp;|&nbsp;
                  3 = Good &nbsp;|&nbsp; 2 = Fair &nbsp;|&nbsp; 1 = Poor
                </small>
              </div>
            )}

            {/* ── Fees ─────────────────────────────────────────────────────── */}
            {components.fees?.enabled && (
              <div className="mb-4">
                <h6 className="fw-bold mb-3">School Fees (₦)</h6>
                <div className="row g-2">
                  {(components.fees.types || []).map((fee, i) => {
                    const key = fee.name.toLowerCase().replace(/\s+/g, '');
                    return (
                      <div key={i} className="col-12 col-sm-6 col-md-4">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text" style={{ minWidth: '100px' }}>
                            {fee.name}
                          </span>
                          <input
                            type="number"
                            className="form-control"
                            value={fees[key] ?? 0}
                            onChange={e =>
                              setFees(prev => ({
                                ...prev,
                                [key]: Math.max(0, Number(e.target.value)),
                              }))
                            }
                            min="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Attendance ───────────────────────────────────────────────── */}
            {components.attendance?.enabled && (
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Attendance</h6>
                <div className="row g-2">
                  {[
                    { label: 'Days School Opened', key: 'opened' },
                    { label: 'Days Present',        key: 'present' },
                    { label: 'Days Absent',         key: 'absent' },
                  ].map(({ label, key }) => (
                    <div key={key} className="col-12 col-md-4">
                      <label className="form-label small">{label}</label>
                      <input
                        type="number"
                        className="form-control"
                        value={attendance[key] ?? 0}
                        onChange={e =>
                          setAttendance(prev => ({
                            ...prev,
                            [key]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Comments ─────────────────────────────────────────────────── */}
            {components.comments?.enabled && (
              <div className="mb-3">
                <h6 className="fw-bold mb-3">Comments</h6>
                {components.comments.teacher && (
                  <div className="mb-3">
                    <label className="form-label">Class Teacher's Comment</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={comments.teacher}
                      onChange={e => setComments(prev => ({ ...prev, teacher: e.target.value }))}
                      placeholder="Enter your comment about the student's performance..."
                    />
                  </div>
                )}
                {components.comments.principal && (
                  <div className="mb-3">
                    <label className="form-label">
                      Principal's Comment
                      <small className="text-muted ms-2">(optional — can be added later)</small>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={comments.principal}
                      onChange={e => setComments(prev => ({ ...prev, principal: e.target.value }))}
                      placeholder="Principal's comment..."
                    />
                  </div>
                )}
              </div>
            )}

          </div>{/* end modal-body */}

          {/* ── Modal Footer ─────────────────────────────────────────────────── */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              {loading
                ? <span className="spinner-border spinner-border-sm me-2" />
                : <Save size={16} className="me-2" />}
              Save as Draft
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              {loading
                ? <span className="spinner-border spinner-border-sm me-2" />
                : <Send size={16} className="me-2" />}
              Submit to Admin
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VisualResultEntry;