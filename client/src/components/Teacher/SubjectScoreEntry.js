// src/components/Teacher/SubjectScoreEntry.jsx
// Subject teacher score entry — Bootstrap 5 styled, mobile-first.
// Only saves rows where teacher typed at least one score (blank rows ignored).

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BookOpen, Save, CheckCircle, AlertCircle, Loader, SlidersHorizontal, X, Info } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

// ── Grade helpers ─────────────────────────────────────────────────────────────
const liveGrade = (total) => {
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

const gradeBadge = (g) => {
  if (!g) return 'secondary';
  if (g.startsWith('A')) return 'success';
  if (g.startsWith('B')) return 'primary';
  if (g === 'C') return 'info';
  if (g === 'D') return 'warning';
  return 'danger';
};

const totalColor = (t) =>
  t >= 50 ? 'success' : t >= 40 ? 'warning' : 'danger';

const deriveRow = (row) => {
  const caNum   = row.ca   !== '' ? Number(row.ca)   : null;
  const examNum = row.exam !== '' ? Number(row.exam) : null;
  const has     = caNum !== null || examNum !== null;
  const total   = (caNum || 0) + (examNum || 0);
  const grade   = has ? liveGrade(total) : null;
  return { has, total, grade };
};

// ── Main component ────────────────────────────────────────────────────────────
const SubjectScoreEntry = () => {
  const token   = localStorage.getItem('accessToken');
  const authHdr = () => `Bearer ${token}`;

  const [mySubjects,  setMySubjects]  = useState([]);
  const [myClasses,   setMyClasses]   = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError,   setMetaError]   = useState('');
  const [caMax,       setCaMax]       = useState(40);
  const [examMax,     setExamMax]     = useState(60);

  const [selectedClass,   setSelectedClass]   = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm,    setSelectedTerm]    = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [showFilters,     setShowFilters]     = useState(false);

  const [rows,        setRows]        = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError,   setRowsError]   = useState('');

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const isDirty = rows.some(r =>
    String(r.ca)   !== String(r.savedCA   ?? '') ||
    String(r.exam) !== String(r.savedExam ?? '')
  );
  const enteredCount = rows.filter(r => r.ca !== '' || r.exam !== '').length;
  const savedCount   = rows.filter(r => r.savedAt).length;
  const selectedClassName = myClasses.find(c => c._id === selectedClass)?.name || '';

  // ── Load meta + scoring scheme ────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores/my-subjects`, { headers: { Authorization: authHdr() } }),
      axios.get(`${REACT_APP_API_URL}/api/teacher/school-branding`,             { headers: { Authorization: authHdr() } }),
    ])
    .then(([metaRes, brandRes]) => {
      const subjects = metaRes.data.subjects || [];
      const classes  = metaRes.data.classes  || [];
      setMySubjects(subjects);
      setMyClasses(classes);
      if (subjects.length) setSelectedSubject(subjects[0]);
      if (classes.length)  setSelectedClass(classes[0]._id);
      const scheme = brandRes.data.school?.scoringScheme;
      if (scheme?.caMax)   setCaMax(Number(scheme.caMax));
      if (scheme?.examMax) setExamMax(Number(scheme.examMax));
    })
    .catch(() => setMetaError('Failed to load your subjects and classes. Please refresh.'))
    .finally(() => setLoadingMeta(false));
  }, []);

  // ── Load rows ─────────────────────────────────────────────────────────────
  const loadScores = useCallback(() => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedSession) return;
    setLoadingRows(true);
    setRowsError('');
    setSaved(false);
    setSaveErr('');
    axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores`, {
      headers: { Authorization: authHdr() },
      params:  { classId: selectedClass, subject: selectedSubject, term: selectedTerm, session: selectedSession },
    })
    .then(res => {
      setRows((res.data.rows || []).map(r => {
        const hasCA   = r.ca   != null && r.ca   !== '';
        const hasExam = r.exam != null && r.exam !== '';
        return {
          studentId: r.studentId,
          name:      r.name,
          regNo:     r.regNo,
          ca:        hasCA   ? String(r.ca)   : '',
          exam:      hasExam ? String(r.exam) : '',
          savedCA:   hasCA   ? String(r.ca)   : '',
          savedExam: hasExam ? String(r.exam) : '',
          savedAt:   r.savedAt || null,
          grade:     r.grade  || '',
        };
      }));
    })
    .catch(err => setRowsError(err.response?.data?.message || 'Failed to load students.'))
    .finally(() => setLoadingRows(false));
  }, [selectedClass, selectedSubject, selectedTerm, selectedSession]);

  useEffect(() => { loadScores(); }, [loadScores]);

  // ── Cell handlers ─────────────────────────────────────────────────────────
  const updateCell = (studentId, field, raw) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setRows(prev => prev.map(r =>
      r.studentId.toString() === studentId.toString() ? { ...r, [field]: cleaned } : r
    ));
    setSaved(false);
    setSaveErr('');
  };

  const clampCell = (studentId, field) => {
    const max = field === 'ca' ? caMax : examMax;
    setRows(prev => prev.map(r => {
      if (r.studentId.toString() !== studentId.toString()) return r;
      if (r[field] === '') return r;
      return { ...r, [field]: String(Math.min(max, Math.max(0, Number(r[field]) || 0))) };
    }));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const toSave = rows
      .filter(r => r.ca !== '' || r.exam !== '')
      .map(r => ({
        studentId: r.studentId,
        ca:   r.ca   !== '' ? Number(r.ca)   : null,
        exam: r.exam !== '' ? Number(r.exam) : null,
      }));

    if (toSave.length === 0) { setSaveErr('Enter at least one score before saving.'); return; }

    setSaving(true); setSaveErr(''); setSaved(false);
    try {
      await axios.post(
        `${REACT_APP_API_URL}/api/teacher/subject-scores`,
        { classId: selectedClass, subject: selectedSubject, term: selectedTerm, session: selectedSession, caMax, examMax, scores: toSave },
        { headers: { Authorization: authHdr() } }
      );
      setSaved(true);
      loadScores();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Early states ──────────────────────────────────────────────────────────
  if (loadingMeta) return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted">
      <Loader size={30} className="text-primary spin" />
      <span>Loading your subjects…</span>
      <SpinStyle />
    </div>
  );

  if (metaError) return (
    <div className="p-3">
      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0">
        <AlertCircle size={18} className="flex-shrink-0" /> {metaError}
      </div>
    </div>
  );

  if (mySubjects.length === 0) return (
    <div className="p-3" style={{ maxWidth: 500 }}>
      <div className="alert alert-warning mb-0">
        <strong className="d-block mb-1">No subjects assigned.</strong>
        <span className="small">Ask your admin to assign you to a subject and class before you can enter scores.</span>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-light min-vh-100">
      <SpinStyle />

      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <nav className="navbar sticky-top navbar-dark bg-dark shadow-sm px-3 py-2" style={{ zIndex: 1030 }}>
        <div className="d-flex align-items-center gap-2 text-white overflow-hidden flex-shrink-1 me-2">
          <BookOpen size={20} className="flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="fw-bold lh-1" style={{ fontSize: 15 }}>Score Entry</div>
            {selectedSubject && selectedClassName && (
              <div className="text-white-50 text-truncate mt-1" style={{ fontSize: 11 }}>
                {selectedSubject} · {selectedClassName} · {selectedTerm}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
          {isDirty && !saving && (
            <span className="badge bg-warning text-dark">Unsaved</span>
          )}
          <button
            className="btn btn-sm btn-outline-light d-md-none"
            onClick={() => setShowFilters(f => !f)}
            title="Toggle filters"
          >
            {showFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
          </button>
          <button
            className="btn btn-sm btn-success d-flex align-items-center gap-1 fw-semibold"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </nav>

      {/* ── Filter bar — always on md+, toggled on mobile ──────────────── */}
      <div className={`bg-white border-bottom px-3 py-2 ${showFilters ? 'd-block' : 'd-none d-md-block'}`}>
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <FilterLabel>Class</FilterLabel>
            <select className="form-select form-select-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {myClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <FilterLabel>Subject</FilterLabel>
            <select className="form-select form-select-sm" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {mySubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <FilterLabel>Term</FilterLabel>
            <select className="form-select form-select-sm" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <FilterLabel>Session</FilterLabel>
            <input className="form-control form-control-sm" value={selectedSession} onChange={e => setSelectedSession(e.target.value)} placeholder="2024/2025" />
          </div>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────── */}
      <div className="px-3 pt-2">
        {saveErr && (
          <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2 py-2 mb-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="small">{saveErr}</span>
            <button className="btn-close ms-auto p-2" onClick={() => setSaveErr('')} />
          </div>
        )}
        {saved && !isDirty && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-2">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span className="small">Scores saved. They appear automatically on each student's result sheet.</span>
          </div>
        )}
        {rowsError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-2">
            <AlertCircle size={16} className="flex-shrink-0" /> {rowsError}
          </div>
        )}
      </div>

      {/* ── Info strip ─────────────────────────────────────────────────── */}
      {rows.length > 0 && !loadingRows && (
        <div className="px-3 pb-2">
          <div className="alert alert-info d-flex align-items-start gap-2 py-2 mb-0 small">
            <Info size={15} className="flex-shrink-0 mt-1" />
            <span>
              CA max <strong>{caMax}</strong> · Exam max <strong>{examMax}</strong> · Total <strong>{caMax + examMax}</strong>.{' '}
              Blank rows are <strong>not saved</strong>.{' '}
              <strong>{savedCount}/{rows.length}</strong> students have saved scores.
            </span>
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="px-3 pb-5">
        {loadingRows ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted">
            <Loader size={28} className="text-primary spin" />
            <span>Loading students…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="card border-0 shadow-sm text-center text-muted py-5 mt-3">
            No students found in this class.
          </div>
        ) : (
          <>
            {/* ── Desktop table (md+) ──────────────────────────────────── */}
            <div className="d-none d-md-block mt-3">
              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Student</th>
                        <th style={{ width: 110 }}>Reg No</th>
                        <th className="text-center" style={{ width: 90 }}>CA <span className="fw-normal opacity-75 small">/{caMax}</span></th>
                        <th className="text-center" style={{ width: 90 }}>Exam <span className="fw-normal opacity-75 small">/{examMax}</span></th>
                        <th className="text-center" style={{ width: 75 }}>Total</th>
                        <th className="text-center" style={{ width: 75 }}>Grade</th>
                        <th className="text-center" style={{ width: 100 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => {
                        const { has, total, grade } = deriveRow(row);
                        const isSaved = !!row.savedAt;
                        return (
                          <tr key={row.studentId} className={!has ? '' : isSaved ? 'table-success' : 'table-warning'}
                            style={{ borderLeft: `3px solid ${isSaved ? 'var(--bs-success)' : has ? 'var(--bs-warning)' : 'transparent'}` }}>
                            <td className="text-muted small ps-3">{idx + 1}</td>
                            <td className="fw-semibold">{row.name}</td>
                            <td className="text-muted small">{row.regNo}</td>
                            <td className="text-center">
                              <ScoreInput
                                value={row.ca} max={caMax}
                                onChange={v => updateCell(row.studentId, 'ca', v)}
                                onBlur={() => clampCell(row.studentId, 'ca')}
                                invalid={row.ca !== '' && Number(row.ca) > caMax}
                              />
                            </td>
                            <td className="text-center">
                              <ScoreInput
                                value={row.exam} max={examMax}
                                onChange={v => updateCell(row.studentId, 'exam', v)}
                                onBlur={() => clampCell(row.studentId, 'exam')}
                                invalid={row.exam !== '' && Number(row.exam) > examMax}
                              />
                            </td>
                            <td className="text-center fw-bold">
                              {has
                                ? <span className={`text-${totalColor(total)}`}>{total}</span>
                                : <span className="text-muted">—</span>
                              }
                            </td>
                            <td className="text-center">
                              {grade
                                ? <span className={`badge bg-${gradeBadge(grade)}`}>{grade}</span>
                                : <span className="text-muted">—</span>
                              }
                            </td>
                            <td className="text-center">
                              <StatusBadge isSaved={isSaved} has={has} savedAt={row.savedAt} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Mobile cards (below md) ───────────────────────────────── */}
            <div className="d-md-none mt-2 d-flex flex-column gap-2">
              {rows.map((row, idx) => {
                const { has, total, grade } = deriveRow(row);
                const isSaved = !!row.savedAt;
                const accentColor = isSaved ? 'var(--bs-success)' : has ? 'var(--bs-warning)' : 'var(--bs-border-color)';
                return (
                  <div key={row.studentId} className="card border-0 shadow-sm overflow-hidden">
                    <div className="card-body p-3" style={{ borderLeft: `4px solid ${accentColor}` }}>

                      {/* Student header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <div className="fw-bold">
                            <span className="text-muted me-1 small">{idx + 1}.</span>
                            {row.name}
                          </div>
                          <div className="text-muted small">{row.regNo}</div>
                        </div>
                        <StatusBadge isSaved={isSaved} has={has} savedAt={row.savedAt} />
                      </div>

                      {/* Score inputs */}
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label mb-1 small text-uppercase fw-semibold text-muted" style={{ fontSize: 10, letterSpacing: .5 }}>
                            CA <span className="fw-normal">(max {caMax})</span>
                          </label>
                          <input
                            type="text" inputMode="numeric" pattern="[0-9]*"
                            className={`form-control form-control-lg text-center fw-bold ${row.ca !== '' && Number(row.ca) > caMax ? 'is-invalid' : ''}`}
                            value={row.ca}
                            placeholder="—"
                            onChange={e => updateCell(row.studentId, 'ca', e.target.value)}
                            onBlur={() => clampCell(row.studentId, 'ca')}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label mb-1 small text-uppercase fw-semibold text-muted" style={{ fontSize: 10, letterSpacing: .5 }}>
                            Exam <span className="fw-normal">(max {examMax})</span>
                          </label>
                          <input
                            type="text" inputMode="numeric" pattern="[0-9]*"
                            className={`form-control form-control-lg text-center fw-bold ${row.exam !== '' && Number(row.exam) > examMax ? 'is-invalid' : ''}`}
                            value={row.exam}
                            placeholder="—"
                            onChange={e => updateCell(row.studentId, 'exam', e.target.value)}
                            onBlur={() => clampCell(row.studentId, 'exam')}
                          />
                        </div>
                      </div>

                      {/* Live total + grade */}
                      {has && (
                        <div className="d-flex align-items-center gap-3 bg-light rounded-2 px-3 py-2 border">
                          <span className="text-muted small">Total</span>
                          <span className={`fw-bold fs-3 lh-1 text-${totalColor(total)}`}>{total}</span>
                          {grade && <span className={`badge bg-${gradeBadge(grade)} fs-6`}>{grade}</span>}
                          {isSaved && row.savedAt && (
                            <span className="text-muted ms-auto" style={{ fontSize: 11 }}>
                              {new Date(row.savedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Sticky save bar ────────────────────────────────────────────── */}
      {isDirty && (
        <div className="position-fixed bottom-0 start-0 end-0 bg-dark border-top border-secondary d-flex align-items-center justify-content-between px-3 py-2 shadow-lg" style={{ zIndex: 1040 }}>
          <span className="text-white-50 small">
            <span className="text-white fw-bold">{enteredCount}</span> student{enteredCount !== 1 ? 's' : ''} with scores
          </span>
          <button
            className="btn btn-success fw-semibold d-flex align-items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? <><Loader size={16} className="spin" /> Saving…</>
              : <><Save size={16} /> Save Scores</>
            }
          </button>
        </div>
      )}
    </div>
  );
};

// ── Small reusable components ─────────────────────────────────────────────────

const ScoreInput = ({ value, max, onChange, onBlur, invalid }) => (
  <input
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    className={`form-control form-control-sm text-center fw-semibold px-1 ${invalid ? 'is-invalid' : ''}`}
    style={{ width: 62 }}
    value={value}
    placeholder="—"
    onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
    onBlur={onBlur}
  />
);

const StatusBadge = ({ isSaved, has, savedAt }) => {
  if (isSaved) return (
    <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 fw-normal">
      <CheckCircle size={11} /> Saved
    </span>
  );
  if (has) return (
    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-normal">
      Unsaved
    </span>
  );
  return <span className="text-muted small">—</span>;
};

const FilterLabel = ({ children }) => (
  <label className="form-label mb-1 small fw-semibold text-uppercase text-muted" style={{ fontSize: 10, letterSpacing: .5 }}>
    {children}
  </label>
);

const SpinStyle = () => (
  <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
);

export default SubjectScoreEntry;