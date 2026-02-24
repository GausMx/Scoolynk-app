// src/components/Teacher/SubjectScoreEntry.jsx
// Subject teacher score entry — properly mobile-responsive.
// Only saves rows where teacher typed at least one score (blank = ignored).
// Saved scores appear automatically on each student's result sheet.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BookOpen, Save, CheckCircle, AlertCircle, Loader, SlidersHorizontal, Info, X
} from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

// ── Responsive hook ──────────────────────────────────────────────────────────
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 640);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = e => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
};

// ── Grade helpers (mirrors backend) ─────────────────────────────────────────
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

const gradeColor = (g) => {
  if (!g) return { bg: '#f1f5f9', text: '#64748b' };
  if (g.startsWith('A')) return { bg: '#dcfce7', text: '#166534' };
  if (g.startsWith('B')) return { bg: '#dbeafe', text: '#1e40af' };
  if (g === 'C')         return { bg: '#cffafe', text: '#155e75' };
  if (g === 'D')         return { bg: '#fef9c3', text: '#854d0e' };
  return                        { bg: '#fee2e2', text: '#991b1b' };
};

// ── Main component ───────────────────────────────────────────────────────────
const SubjectScoreEntry = () => {
  const token    = localStorage.getItem('accessToken');
  const authHdr  = () => `Bearer ${token}`;
  const isDesktop = useIsDesktop();

  // Teacher meta
  const [mySubjects,  setMySubjects]  = useState([]);
  const [myClasses,   setMyClasses]   = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError,   setMetaError]   = useState('');

  // Filters
  const [selectedClass,   setSelectedClass]   = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm,    setSelectedTerm]    = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [showFilters,     setShowFilters]     = useState(false); // mobile only

  // Rows: { studentId, name, regNo, ca, exam, savedCA, savedExam, savedAt, grade }
  // ca/exam are strings; '' = not entered
  const [rows,        setRows]        = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError,   setRowsError]   = useState('');

  // Save
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  // Dirty = any row's current value differs from what was last saved
  const isDirty = rows.some(r =>
    String(r.ca)   !== String(r.savedCA   ?? '') ||
    String(r.exam) !== String(r.savedExam ?? '')
  );

  // ── Load teacher meta ────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores/my-subjects`, {
      headers: { Authorization: authHdr() }
    })
    .then(res => {
      const subjects = res.data.subjects || [];
      const classes  = res.data.classes  || [];
      setMySubjects(subjects);
      setMyClasses(classes);
      if (subjects.length) setSelectedSubject(subjects[0]);
      if (classes.length)  setSelectedClass(classes[0]._id);
    })
    .catch(() => setMetaError('Failed to load your subjects and classes. Please refresh.'))
    .finally(() => setLoadingMeta(false));
  }, []);

  // ── Load rows when filters change ────────────────────────────────────────
  const loadScores = useCallback(() => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedSession) return;
    setLoadingRows(true);
    setRowsError('');
    setSaved(false);
    setSaveErr('');

    axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores`, {
      headers: { Authorization: authHdr() },
      params:  { classId: selectedClass, subject: selectedSubject, term: selectedTerm, session: selectedSession }
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
          grade:     r.grade   || '',
        };
      }));
    })
    .catch(err => setRowsError(err.response?.data?.message || 'Failed to load students.'))
    .finally(() => setLoadingRows(false));
  }, [selectedClass, selectedSubject, selectedTerm, selectedSession]);

  useEffect(() => { loadScores(); }, [loadScores]);

  // ── Cell update ──────────────────────────────────────────────────────────
  const updateCell = (studentId, field, raw) => {
    // Accept empty string freely; clamp on blur
    setRows(prev => prev.map(r =>
      r.studentId.toString() === studentId.toString() ? { ...r, [field]: raw } : r
    ));
    setSaved(false);
    setSaveErr('');
  };

  const clampCell = (studentId, field) => {
    const max = field === 'ca' ? 40 : 60;
    setRows(prev => prev.map(r => {
      if (r.studentId.toString() !== studentId.toString()) return r;
      if (r[field] === '') return r;
      const clamped = Math.min(max, Math.max(0, Number(r[field]) || 0));
      return { ...r, [field]: String(clamped) };
    }));
  };

  // ── Save — only filled rows ──────────────────────────────────────────────
  const handleSave = async () => {
    const toSave = rows
      .filter(r => r.ca !== '' || r.exam !== '')
      .map(r => ({
        studentId: r.studentId,
        ca:        r.ca   !== '' ? Number(r.ca)   : 0,
        exam:      r.exam !== '' ? Number(r.exam) : 0,
      }));

    if (toSave.length === 0) {
      setSaveErr('Enter at least one score before saving.');
      return;
    }

    setSaving(true);
    setSaveErr('');
    setSaved(false);

    try {
      await axios.post(
        `${REACT_APP_API_URL}/api/teacher/subject-scores`,
        {
          classId:  selectedClass,
          subject:  selectedSubject,
          term:     selectedTerm,
          session:  selectedSession,
          scores:   toSave,
        },
        { headers: { Authorization: authHdr() } }
      );
      setSaved(true);
      loadScores(); // refresh to get server grades + savedAt
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Counts ───────────────────────────────────────────────────────────────
  const enteredCount = rows.filter(r => r.ca !== '' || r.exam !== '').length;
  const savedCount   = rows.filter(r => r.savedAt).length;
  const selectedClassName = myClasses.find(c => c._id === selectedClass)?.name || '';

  // ── Early returns ────────────────────────────────────────────────────────
  if (loadingMeta) return (
    <Splash><Loader size={28} className="spin" style={{ color: '#3b82f6' }} /><p>Loading your subjects…</p></Splash>
  );
  if (metaError) return (
    <div style={{ padding: 24 }}><AlertBox type="error">{metaError}</AlertBox></div>
  );
  if (mySubjects.length === 0) return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <AlertBox type="warning">
        <strong>No subjects assigned.</strong><br />
        Ask your admin to assign you to a subject and class.
      </AlertBox>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit', paddingBottom: isDirty ? 80 : 0 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1e293b', color: '#fff',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <BookOpen size={20} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Score Entry</div>
            {selectedSubject && selectedClassName && (
              <div style={{ fontSize: 11, opacity: .75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedSubject} · {selectedClassName} · {selectedTerm}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isDirty && !saving && (
            <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
              Unsaved
            </span>
          )}
          {/* Filter toggle — only on mobile */}
          {!isDesktop && (
            <button onClick={() => setShowFilters(f => !f)} style={iconBtnStyle} title="Filters">
              {showFilters ? <X size={18} /> : <SlidersHorizontal size={18} />}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: (!isDirty || saving) ? 0.45 : 1,
              cursor: (!isDirty || saving) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? <Loader size={15} className="spin" /> : <Save size={15} />}
            Save
          </button>
        </div>
      </div>

      {/* ── Filter panel ───────────────────────────────────────────────── */}
      {/* Desktop: always visible. Mobile: toggled. */}
      {(isDesktop || showFilters) && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : '1fr 1fr',
            gap: 10,
          }}>
            <LabeledSelect label="Class" value={selectedClass} onChange={setSelectedClass}>
              {myClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </LabeledSelect>
            <LabeledSelect label="Subject" value={selectedSubject} onChange={setSelectedSubject}>
              {mySubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </LabeledSelect>
            <LabeledSelect label="Term" value={selectedTerm} onChange={setSelectedTerm}>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </LabeledSelect>
            <div>
              <label style={labelStyle}>Session</label>
              <input
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                placeholder="2024/2025"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback ───────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px' }}>
        {saveErr && <AlertBox type="error" style={{ marginTop: 12 }}>{saveErr}</AlertBox>}
        {saved && !isDirty && (
          <AlertBox type="success" style={{ marginTop: 12 }}>
            <CheckCircle size={16} />
            Scores saved. They appear automatically on each student's result sheet when the class teacher opens it.
          </AlertBox>
        )}
        {rowsError && <AlertBox type="error" style={{ marginTop: 12 }}>{rowsError}</AlertBox>}
      </div>

      {/* ── Info strip ─────────────────────────────────────────────────── */}
      {rows.length > 0 && !loadingRows && (
        <div style={{ padding: '8px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1e40af',
          }}>
            <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              Blank rows are ignored — only students you fill scores for get saved.{' '}
              <strong style={{ color: '#1e40af' }}>{savedCount} of {rows.length}</strong> students have saved scores for this subject.
            </span>
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 16px' }}>
        {loadingRows ? (
          <Splash><Loader size={28} className="spin" style={{ color: '#3b82f6' }} /><p>Loading students…</p></Splash>
        ) : rows.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 40, textAlign: 'center', color: '#64748b', marginTop: 8 }}>
            No students found in this class.
          </div>
        ) : isDesktop ? (
          <DesktopTable rows={rows} updateCell={updateCell} clampCell={clampCell} />
        ) : (
          <MobileCards rows={rows} updateCell={updateCell} clampCell={clampCell} />
        )}
      </div>

      {/* ── Sticky save bar (when dirty) ───────────────────────────────── */}
      {isDirty && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0f172a', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          zIndex: 200, boxShadow: '0 -4px 24px rgba(0,0,0,.4)',
        }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#fff' }}>{enteredCount}</strong>{' '}
            student{enteredCount !== 1 ? 's' : ''} with scores to save
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10,
              padding: '11px 28px', fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              boxShadow: '0 0 0 3px rgba(34,197,94,.35)',
            }}
          >
            {saving
              ? <><Loader size={18} className="spin" />Saving…</>
              : <><Save size={18} />Save Scores</>
            }
          </button>
        </div>
      )}
    </div>
  );
};

// ── Desktop table ────────────────────────────────────────────────────────────
const DesktopTable = ({ rows, updateCell, clampCell }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
          <TH w={32}>#</TH>
          <TH left>Student Name</TH>
          <TH w={90}>Reg No</TH>
          <TH w={80}>CA <small style={{ fontWeight: 400, color: '#94a3b8' }}>/40</small></TH>
          <TH w={80}>Exam <small style={{ fontWeight: 400, color: '#94a3b8' }}>/60</small></TH>
          <TH w={60}>Total</TH>
          <TH w={60}>Grade</TH>
          <TH w={90}>Status</TH>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const { caNum, examNum, has, total, grade, gc } = deriveRow(row);
          const isSaved = !!row.savedAt;
          return (
            <tr key={row.studentId} style={{
              borderBottom: '1px solid #f1f5f9',
              background: isSaved ? '#fff' : has ? '#fefce8' : '#fff',
              borderLeft: `3px solid ${isSaved ? '#22c55e' : has ? '#f59e0b' : 'transparent'}`,
            }}>
              <TD center><span style={{ color: '#94a3b8', fontSize: 12 }}>{idx + 1}</span></TD>
              <TD left><span style={{ fontWeight: 600 }}>{row.name}</span></TD>
              <TD center><span style={{ fontSize: 12, color: '#64748b' }}>{row.regNo}</span></TD>
              <TD center>
                <ScoreInput
                  value={row.ca} max={40}
                  onChange={v => updateCell(row.studentId, 'ca', v)}
                  onBlur={() => clampCell(row.studentId, 'ca')}
                />
              </TD>
              <TD center>
                <ScoreInput
                  value={row.exam} max={60}
                  onChange={v => updateCell(row.studentId, 'exam', v)}
                  onBlur={() => clampCell(row.studentId, 'exam')}
                />
              </TD>
              <TD center>
                <span style={{ fontWeight: 700, color: has ? scoreColor(total) : '#cbd5e1' }}>
                  {has ? total : '—'}
                </span>
              </TD>
              <TD center>
                {grade
                  ? <span style={{ background: gc.bg, color: gc.text, borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{grade}</span>
                  : <span style={{ color: '#e2e8f0' }}>—</span>
                }
              </TD>
              <TD center>
                {isSaved
                  ? <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                      <CheckCircle size={12} /> Saved
                    </span>
                  : has
                    ? <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Unsaved</span>
                    : <span style={{ fontSize: 11, color: '#d1d5db' }}>No score</span>
                }
              </TD>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Mobile cards ─────────────────────────────────────────────────────────────
const MobileCards = ({ rows, updateCell, clampCell }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
    {rows.map((row, idx) => {
      const { has, total, grade, gc } = deriveRow(row);
      const isSaved = !!row.savedAt;
      return (
        <div key={row.studentId} style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${isSaved ? '#22c55e' : has ? '#f59e0b' : '#e2e8f0'}`,
          borderRadius: 10,
          padding: 14,
          boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          {/* Student header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                <span style={{ color: '#cbd5e1', fontSize: 12, marginRight: 6 }}>{idx + 1}.</span>
                {row.name}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{row.regNo}</div>
            </div>
            {isSaved && (
              <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '2px 8px' }}>
                <CheckCircle size={11} /> Saved
              </span>
            )}
            {!isSaved && has && (
              <span style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
                Unsaved
              </span>
            )}
          </div>

          {/* Score inputs — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: has ? 12 : 0 }}>
            <div>
              <label style={{ ...labelStyle, marginBottom: 6 }}>
                CA Score <span style={{ color: '#94a3b8', fontWeight: 400 }}>(max 40)</span>
              </label>
              <input
                type="number" inputMode="numeric"
                min={0} max={40}
                value={row.ca}
                placeholder="—"
                onChange={e => updateCell(row.studentId, 'ca', e.target.value)}
                onBlur={() => clampCell(row.studentId, 'ca')}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 700, padding: '10px 8px' }}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 6 }}>
                Exam Score <span style={{ color: '#94a3b8', fontWeight: 400 }}>(max 60)</span>
              </label>
              <input
                type="number" inputMode="numeric"
                min={0} max={60}
                value={row.exam}
                placeholder="—"
                onChange={e => updateCell(row.studentId, 'exam', e.target.value)}
                onBlur={() => clampCell(row.studentId, 'exam')}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 700, padding: '10px 8px' }}
              />
            </div>
          </div>

          {/* Live result summary */}
          {has && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#f8fafc', borderRadius: 8, padding: '10px 14px',
              border: '1px solid #f1f5f9',
            }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: scoreColor(total) }}>{total}</div>
              <div style={{ fontWeight: 700, fontSize: 14, ...gc, borderRadius: 6, padding: '3px 12px' }}>{grade}</div>
              {isSaved && row.savedAt && (
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
                  {new Date(row.savedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ── Shared logic ─────────────────────────────────────────────────────────────
const deriveRow = (row) => {
  const caNum   = row.ca   !== '' ? Number(row.ca)   : null;
  const examNum = row.exam !== '' ? Number(row.exam) : null;
  const has     = caNum !== null || examNum !== null;
  const total   = (caNum || 0) + (examNum || 0);
  const grade   = has ? liveGrade(total) : null;
  const gc      = gradeColor(grade);
  return { caNum, examNum, has, total, grade, gc };
};

const scoreColor = (total) =>
  total >= 50 ? '#16a34a' : total >= 40 ? '#d97706' : '#dc2626';

// ── Small shared components ──────────────────────────────────────────────────
const ScoreInput = ({ value, max, onChange, onBlur }) => (
  <input
    type="number" min={0} max={max}
    value={value}
    placeholder="—"
    onChange={e => onChange(e.target.value)}
    onBlur={onBlur}
    style={{
      width: 58, textAlign: 'center',
      border: '1px solid',
      borderColor: value === '' ? '#e2e8f0' : Number(value) > max ? '#fca5a5' : '#cbd5e1',
      borderRadius: 6, padding: '5px 4px', fontSize: 14,
      background: value === '' ? '#f8fafc' : '#fff',
      outline: 'none',
    }}
  />
);

const TH = ({ children, left, w }) => (
  <th style={{ padding: '10px 12px', textAlign: left ? 'left' : 'center', fontSize: 12, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', width: w }}>
    {children}
  </th>
);

const TD = ({ children, center, left }) => (
  <td style={{ padding: '10px 12px', textAlign: center ? 'center' : left ? 'left' : 'center', verticalAlign: 'middle' }}>
    {children}
  </td>
);

const LabeledSelect = ({ label, value, onChange, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
      {children}
    </select>
  </div>
);

const AlertBox = ({ type, children, style: extraStyle }) => {
  const colours = {
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  };
  const c = colours[type] || colours.warning;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: c.text, ...extraStyle }}>
      {type === 'error' ? <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} /> : <CheckCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />}
      <span>{children}</span>
    </div>
  );
};

const Splash = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12, color: '#64748b' }}>
    {children}
  </div>
);

// ── Shared styles ────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
};
const inputStyle = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '8px 10px', fontSize: 13, background: '#fff',
  boxSizing: 'border-box', outline: 'none',
};
const iconBtnStyle = {
  background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 6,
  padding: '7px 9px', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center',
};

export default SubjectScoreEntry;