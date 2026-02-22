// src/components/Teacher/VisualResultEntry.js
// Teacher fills results directly ON the real Nigerian result sheet.
// School branding (logo, name, motto, address) is fetched fresh and rendered live.

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Send, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

// ─── Grade helpers ────────────────────────────────────────────────────────────
const getNigerianGrade = (total) => {
  if (total >= 95) return { grade: 'A+', remark: 'EXCEPTIONAL' };
  if (total >= 90) return { grade: 'A',  remark: 'DISTINCTION' };
  if (total >= 85) return { grade: 'A-', remark: 'EXCELLENT' };
  if (total >= 80) return { grade: 'B+', remark: 'VERY GOOD' };
  if (total >= 75) return { grade: 'B',  remark: 'VERY GOOD' };
  if (total >= 70) return { grade: 'B-', remark: 'GOOD' };
  if (total >= 60) return { grade: 'C',  remark: 'AVERAGE' };
  if (total >= 40) return { grade: 'D',  remark: 'BELOW AVERAGE' };
  return            { grade: 'F',  remark: 'FAIL' };
};

const ordinal = (n) => {
  if (!n) return '—';
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// ─── Shared inline-input style (transparent, fits the sheet) ─────────────────
const inputStyle = (width = '100%', align = 'left', extra = {}) => ({
  width,
  border: 'none',
  borderBottom: '1px solid #aaa',
  background: 'rgba(255,255,255,0.01)',
  outline: 'none',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '10px',
  color: '#000',
  padding: '0 1px',
  textAlign: align,
  ...extra,
});

const numberInputStyle = (extra = {}) => ({
  ...inputStyle('100%', 'center'),
  MozAppearance: 'textfield',
  ...extra,
});

// ─── All 16 trait keys and their labels ──────────────────────────────────────
const AFFECTIVE_SKILLS = [
  { label: 'Attentiveness',            key: 'attentiveness' },
  { label: 'Honesty',                  key: 'honesty' },
  { label: 'Neatness',                 key: 'neatness' },
  { label: 'Politeness',               key: 'politeness' },
  { label: 'Punctuality/Assembly',     key: 'punctuality' },
  { label: 'Self Control/Calmness',    key: 'selfControl' },
  { label: 'Obedience',                key: 'obedience' },
  { label: 'Reliability',              key: 'reliability' },
  { label: 'Sense of Responsibility',  key: 'responsibility' },
  { label: 'Relationship With Others', key: 'relationship' },
];

const PSYCHOMOTOR_SKILLS = [
  { label: 'Handling Of Tools',  key: 'handlingOfTools' },
  { label: 'Drawing/Painting',   key: 'drawingPainting' },
  { label: 'Handwriting',        key: 'handwriting' },
  { label: 'Public Speaking',    key: 'publicSpeaking' },
  { label: 'Speech Fluency',     key: 'speechFluency' },
  { label: 'Sports & Games',     key: 'sportsGames' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // ── School branding (fetched fresh) ─────────────────────────────────────────
  const [school, setSchool] = useState({
    name: '', address: '', phone: '', email: '', motto: '', logoBase64: '', principalName: '',
  });

  // ── Result data state ────────────────────────────────────────────────────────
  const [subjects,   setSubjects]   = useState([]);
  const [traits,     setTraits]     = useState({});
  const [attendance, setAttendance] = useState({ opened: '', present: '', absent: '' });
  const [comments,   setComments]   = useState({ teacher: '', principal: '' });
  const [termBegins, setTermBegins] = useState('');
  const [termEnds,   setTermEnds]   = useState('');
  const [nextTerm,   setNextTerm]   = useState('');
  const [classSize,  setClassSize]  = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(true);
  const [error,        setError]        = useState('');

  // ── 1. Fetch school branding ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setError('Authentication token missing.'); setFetching(false); return; }
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
      headers: { Authorization: authHeader },
    })
    .then(res => {
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
    })
    .catch(err => console.warn('[VisualResultEntry] Could not fetch school branding:', err.message))
    .finally(() => setFetching(false));
  }, [token]);

  // ── 2. Initialise result data from existingResult or template ────────────────
  useEffect(() => {
    if (existingResult) {
      // Editing a saved draft — restore all fields
      const s = (existingResult.subjects || []).map(sub => ({
        subject: sub.subject || '',
        ca:      sub.ca ?? sub.ca1 ?? 0,
        exam:    sub.exam ?? 0,
      }));
      setSubjects(s.length ? s : buildEmptySubjects());
      setTraits(existingResult.affectiveTraits || defaultTraits());
      setAttendance(existingResult.attendance   || { opened: '', present: '', absent: '' });
      setComments(existingResult.comments       || { teacher: '', principal: '' });
      setTermBegins(existingResult.termBegins   || '');
      setTermEnds(existingResult.termEnds       || '');
      setNextTerm(existingResult.nextTermResumption || '');
      setClassSize(existingResult.classSize     || '');
      return;
    }

    // New result — initialise from template subjects list
    setSubjects(buildEmptySubjects());
    setTraits(defaultTraits());
  }, [existingResult, template]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const buildEmptySubjects = useCallback(() => {
    const templateSubjects = template?.components?.subjects || [];
    if (templateSubjects.length) {
      return templateSubjects.map(s => ({
        subject: typeof s === 'string' ? s : (s.name || s.subject || ''),
        ca: 0, exam: 0,
      }));
    }
    // Fallback: blank rows
    const count = template?.components?.scoresTable?.defaultSubjects || 12;
    return Array.from({ length: count }, () => ({ subject: '', ca: 0, exam: 0 }));
  }, [template]);

  const defaultTraits = () => {
    const t = {};
    [...AFFECTIVE_SKILLS, ...PSYCHOMOTOR_SKILLS].forEach(s => { t[s.key] = 0; });
    return t;
  };

  // ── Subject field update ──────────────────────────────────────────────────────
  const updateSubject = (idx, field, raw) => {
    const val = field === 'subject' ? raw : Math.min(field === 'ca' ? 40 : 60, Math.max(0, Number(raw) || 0));
    setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const addSubjectRow = () => setSubjects(prev => [...prev, { subject: '', ca: 0, exam: 0 }]);
  const removeSubjectRow = (idx) => setSubjects(prev => prev.filter((_, i) => i !== idx));

  // ── Trait click ───────────────────────────────────────────────────────────────
  const setTrait = (key, val) => setTraits(prev => ({ ...prev, [key]: val }));

  // ── Computed values ───────────────────────────────────────────────────────────
  const computedSubjects = subjects.map(s => {
    const total = Math.min(100, (Number(s.ca) || 0) + (Number(s.exam) || 0));
    return { ...s, total, ...getNigerianGrade(total) };
  });

  const totalObtainable = subjects.filter(s => s.subject?.trim()).length * 100;
  const totalObtained   = computedSubjects.filter(s => s.subject?.trim()).reduce((acc, s) => acc + s.total, 0);
  const percentage      = totalObtainable > 0 ? ((totalObtained / totalObtainable) * 100).toFixed(1) : '0.0';
  const overallGrade    = getNigerianGrade(parseFloat(percentage));

  // ── Save / Submit ─────────────────────────────────────────────────────────────
  const handleSave = async (submitToAdmin = false) => {
    setError('');
    if (!token) { setError('Authentication token missing.'); return; }

    const validSubjects = computedSubjects.filter(s => s.subject?.trim());
    if (!validSubjects.length) { setError('Please enter at least one subject name.'); return; }

    const payload = {
      studentId:          student._id,
      term,
      session,
      subjects:           validSubjects.map(({ subject, ca, exam, total }) => ({ subject, ca, exam, total })),
      affectiveTraits:    traits,
      attendance:         { opened: Number(attendance.opened)||0, present: Number(attendance.present)||0, absent: Number(attendance.absent)||0 },
      comments,
      termBegins:         termBegins || undefined,
      termEnds:           termEnds   || undefined,
      nextTermResumption: nextTerm   || undefined,
      classSize:          classSize  ? Number(classSize) : undefined,
      status:             submitToAdmin ? 'submitted' : 'draft',
    };
    if (existingResult) payload.resultId = existingResult._id;

    try {
      setLoading(true);
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/results`,
        payload,
        { headers: { Authorization: authHeader, 'Content-Type': 'application/json' } }
      );
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => { window.location.href = '/login'; }, 2500);
      } else {
        setError(err.response?.data?.message || 'Failed to save result.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!template) {
    return (
      <div className="alert alert-warning m-3 d-flex align-items-center gap-2">
        <AlertCircle size={20} />
        No template found for {term}, {session}. Ask your admin to create one.
      </div>
    );
  }

  // ─── Styles (inline, PDF-safe) ────────────────────────────────────────────────
  const S = {
    page: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '11px', color: '#000', backgroundColor: '#fff',
      maxWidth: '900px', margin: '0 auto', padding: '12px 16px',
      border: '2px solid #000', boxSizing: 'border-box',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '14px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '2px solid #000',
    },
    sessionBanner: {
      textAlign: 'center', fontWeight: 'bold', fontSize: '13px',
      border: '1px solid #000', padding: '3px 0', margin: '5px 0',
      backgroundColor: '#f0f0f0', textTransform: 'uppercase',
    },
    topBand: {
      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
      border: '1px solid #000', marginBottom: '4px',
    },
    topCell:     { padding: '3px 5px', borderRight: '1px solid #000' },
    topCellLast: { padding: '3px 5px' },
    sectionTitle: {
      fontWeight: 'bold', textAlign: 'center',
      borderBottom: '1px solid #ccc', marginBottom: '3px', paddingBottom: '2px', fontSize: '10px',
    },
    bioPair: { display: 'flex', marginBottom: '2px', gap: '4px', alignItems: 'center' },
    label:   { fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap' },
    attGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '2px' },
    attCol:  { borderRight: '1px solid #ccc', padding: '1px 0' },
    attLabel:{ fontSize: '9px', borderBottom: '1px solid #ccc' },
    summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', fontSize: '10px' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '4px', fontSize: '10px' },
    th: { border: '1px solid #000', padding: '2px 3px', textAlign: 'center', backgroundColor: '#e8e8e8', fontWeight: 'bold', fontSize: '9px' },
    td: { border: '1px solid #000', padding: '1px 2px', textAlign: 'center' },
    tdLeft: { border: '1px solid #000', padding: '1px 4px', textAlign: 'left' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' },
    domainBox: { border: '1px solid #000' },
    domainHeader: { backgroundColor: '#e8e8e8', fontWeight: 'bold', textAlign: 'center', padding: '2px', fontSize: '10px', borderBottom: '1px solid #000' },
    domainScaleHeader: { display: 'flex', backgroundColor: '#e8e8e8', borderBottom: '1px solid #000', fontSize: '9px' },
    domainScaleLabel: { flex: 3, padding: '1px 4px', borderRight: '1px solid #000' },
    domainScaleCols: { flex: 2, display: 'flex' },
    domainScaleCol: { flex: 1, textAlign: 'center', borderRight: '1px solid #ccc', padding: '1px 0', fontWeight: 'bold' },
    domainRow: { display: 'flex', borderBottom: '1px solid #e0e0e0', fontSize: '9.5px' },
    domainRowLabel: { flex: 3, padding: '1px 4px', borderRight: '1px solid #000' },
    domainRowCols: { flex: 2, display: 'flex' },
    domainRowCol: { flex: 1, textAlign: 'center', borderRight: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' },
    commentBox: { border: '1px solid #000', padding: '4px' },
    commentsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' },
    gradeBox: { border: '1px solid #000', padding: '4px', fontSize: '9.5px' },
    gradeHeader: { fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', marginBottom: '3px', paddingBottom: '2px', fontSize: '10px' },
    gradeRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '1px' },
    ratingBox: { border: '1px solid #000', padding: '4px', fontSize: '9px' },
    ratingHeader: { fontWeight: 'bold', fontSize: '10px', marginBottom: '3px' },
  };

  // ── Clickable trait rating (1-5 boxes on the sheet) ──────────────────────────
  const TraitRow = ({ skill, odd }) => {
    const val = traits[skill.key] || 0;
    return (
      <div style={{ ...S.domainRow, backgroundColor: odd ? '#fafafa' : '#fff' }}>
        <div style={S.domainRowLabel}>{skill.label}</div>
        <div style={S.domainRowCols}>
          {[5,4,3,2,1].map(n => (
            <div
              key={n}
              style={{
                ...S.domainRowCol,
                backgroundColor: val === n ? '#222' : 'transparent',
                color: val === n ? '#fff' : '#000',
              }}
              onClick={() => setTrait(skill.key, val === n ? 0 : n)}
              title={`Rate ${n}`}
            >
              {val === n ? '✓' : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DomainSection = ({ title, skills }) => (
    <div style={S.domainBox}>
      <div style={S.domainHeader}>{title}</div>
      <div style={S.domainScaleHeader}>
        <div style={S.domainScaleLabel}>Traits</div>
        <div style={S.domainScaleCols}>
          {[5,4,3,2,1].map(n => <div key={n} style={S.domainScaleCol}>{n}</div>)}
        </div>
      </div>
      {skills.map((skill, i) => <TraitRow key={skill.key} skill={skill} odd={i % 2 !== 0} />)}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, overflowY: 'auto', padding: '16px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* ── Sticky toolbar ─────────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: '#1e293b', color: '#fff',
          padding: '10px 16px', borderRadius: '8px 8px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
              {student?.name} — Result Entry
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              {term}, {session} &nbsp;·&nbsp; Fill directly on the sheet below
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => handleSave(false)}
              disabled={loading || fetching}
              style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} />
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading || fetching}
              style={{ padding: '6px 14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={15} />
              {loading ? 'Submitting...' : 'Submit to Admin'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              style={{ padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Error banner ───────────────────────────────────────────────────── */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '8px 14px', borderLeft: '4px solid #dc2626', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Instruction strip ──────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '6px 14px', fontSize: '12px', color: '#92400e' }}>
          💡 <strong>Tip:</strong> Click any yellow-highlighted cell to edit. Click trait columns (5–1) to rate. Totals and grades calculate automatically.
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            THE ACTUAL RESULT SHEET — editable version
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={S.page}>

          {/* ── HEADER: Logo | School Info | Passport ──────────────────────── */}
          <div style={S.header}>
            {school.logoBase64 ? (
              <img src={school.logoBase64} alt="School Logo" style={{ width: 72, height: 72, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 72, height: 72, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#aaa', textAlign: 'center' }}>
                No Logo<br/>(add in Settings)
              </div>
            )}

            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {school.name || 'SCHOOL NAME'}
              </div>
              {school.motto && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>Motto: {school.motto}</div>}
              {school.address && <div style={{ fontSize: '9.5px' }}>{school.address}</div>}
              {(school.phone || school.email) && (
                <div style={{ fontSize: '9.5px' }}>
                  {school.phone && `Tel: ${school.phone}`}
                  {school.phone && school.email && ' | '}
                  {school.email && `Email: ${school.email}`}
                </div>
              )}
            </div>

            {/* Passport photo slot (uploaded by parent) */}
            {student.passportBase64 ? (
              <img src={student.passportBase64} alt="Passport" style={{ width: 68, height: 80, objectFit: 'cover', border: '1px solid #000' }} />
            ) : (
              <div style={{ width: 68, height: 80, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#aaa', textAlign: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: 20 }}>👤</span>
                <span>Passport<br/>Photo</span>
              </div>
            )}
          </div>

          {/* ── SESSION BANNER ─────────────────────────────────────────────── */}
          <div style={S.sessionBanner}>
            {session} — {term.toUpperCase()} PUPIL'S PERFORMANCE REPORT
          </div>

          {/* ── TOP BAND ───────────────────────────────────────────────────── */}
          <div style={S.topBand}>

            {/* Personal Data (read-only — from student record) */}
            <div style={S.topCell}>
              <div style={S.sectionTitle}>PERSONAL DATA</div>
              {[
                ['NAME', student.name],
                ['ADMIN NO', student.admNo || student.regNo],
                ['GENDER', student.gender],
                ['CLASS', student.classId?.name || student.className],
                ['D.O.B', student.dob],
                ['CLUB/SOCIETY', student.club],
              ].map(([lbl, val]) => (
                <div key={lbl} style={S.bioPair}>
                  <span style={S.label}>{lbl}:</span>
                  <span style={{ fontSize: '10px' }}>{val || '—'}</span>
                </div>
              ))}
            </div>

            {/* Attendance + Term Dates (EDITABLE) */}
            <div style={S.topCell}>
              <div style={S.sectionTitle}>ATTENDANCE</div>
              <div style={S.attGrid}>
                {[
                  ['No of Times\nSchool Opened', 'opened'],
                  ['No of Times\nPresent',       'present'],
                  ['No of Times\nAbsent',        'absent'],
                ].map(([lbl, key], i) => (
                  <div key={key} style={{ ...S.attCol, borderRight: i < 2 ? '1px solid #ccc' : 'none' }}>
                    <div style={S.attLabel}>{lbl}</div>
                    <input
                      type="number"
                      min={0}
                      value={attendance[key]}
                      onChange={e => setAttendance(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ ...numberInputStyle(), fontSize: '13px', fontWeight: 'bold', width: '100%', backgroundColor: '#fffde7' }}
                      title={`Edit ${lbl}`}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '6px', fontWeight: 'bold', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '3px', fontSize: '10px' }}>
                TERMINAL DURATION
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginTop: '2px', gap: '4px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>Term Beginning</div>
                  <input
                    type="date"
                    value={termBegins}
                    onChange={e => setTermBegins(e.target.value)}
                    style={{ ...inputStyle('100%'), backgroundColor: '#fffde7', fontSize: '9px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>Term Ending</div>
                  <input
                    type="date"
                    value={termEnds}
                    onChange={e => setTermEnds(e.target.value)}
                    style={{ ...inputStyle('100%'), backgroundColor: '#fffde7', fontSize: '9px' }}
                  />
                </div>
              </div>
            </div>

            {/* Performance Summary (computed, read-only) */}
            <div style={S.topCellLast}>
              <div style={S.sectionTitle}>PERFORMANCE SUMMARY</div>
              <div style={S.summaryGrid}>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Total Score Obtainable</div>
                <div style={{ fontSize: '10px' }}>{totalObtainable}</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Total Score Obtained</div>
                <div style={{ fontSize: '10px' }}>{totalObtained}</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>%TAGE</div>
                <div style={{ fontSize: '10px' }}>{percentage}%</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>GRADE</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{overallGrade.grade}</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>POSITION</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>—</div>
                <div style={{ fontWeight: 'bold', fontSize: '10px' }}>CLASS SIZE</div>
                <div>
                  <input
                    type="number"
                    min={1}
                    value={classSize}
                    onChange={e => setClassSize(e.target.value)}
                    style={{ ...numberInputStyle(), backgroundColor: '#fffde7', width: '50px' }}
                    title="Class size"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── COGNITIVE DOMAIN TABLE ─────────────────────────────────────── */}
          <div style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#d8d8d8', border: '1px solid #000', borderBottom: 'none', padding: '2px', fontSize: '11px' }}>
            COGNITIVE DOMAIN
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '20%', textAlign: 'left' }} rowSpan={2}>SUBJECTS</th>
                <th style={S.th}>C.A.</th>
                <th style={S.th}>EXAM</th>
                <th style={{ ...S.th, fontWeight: 'bold' }}>TOTAL</th>
                <th style={S.th}>2ND TERM</th>
                <th style={S.th}>1ST TERM</th>
                <th style={S.th}>SESSION AVG</th>
                <th style={S.th}>CLASS POS.</th>
                <th style={S.th}>CLASS AVG</th>
                <th style={S.th}>GRADE</th>
                <th style={S.th}>REMARKS</th>
                <th style={{ ...S.th, width: '24px' }}></th>
              </tr>
              <tr>
                <th style={S.th}>40</th>
                <th style={S.th}>60</th>
                <th style={S.th}>100</th>
                <th style={S.th}>100</th>
                <th style={S.th}>100</th>
                <th style={S.th}>100</th>
                <th style={S.th}></th>
                <th style={S.th}></th>
                <th style={S.th}></th>
                <th style={S.th}></th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {computedSubjects.map((subj, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  {/* Subject name */}
                  <td style={S.tdLeft}>
                    <input
                      type="text"
                      value={subj.subject}
                      onChange={e => updateSubject(idx, 'subject', e.target.value)}
                      style={{ ...inputStyle('100%', 'left'), backgroundColor: '#fffde7', textTransform: 'uppercase' }}
                      placeholder="Subject name"
                    />
                  </td>

                  {/* CA (editable, max 40) */}
                  <td style={S.td}>
                    <input
                      type="number" min={0} max={40}
                      value={subj.ca}
                      onChange={e => updateSubject(idx, 'ca', e.target.value)}
                      style={{ ...numberInputStyle(), backgroundColor: '#fffde7', width: '38px' }}
                    />
                  </td>

                  {/* Exam (editable, max 60) */}
                  <td style={S.td}>
                    <input
                      type="number" min={0} max={60}
                      value={subj.exam}
                      onChange={e => updateSubject(idx, 'exam', e.target.value)}
                      style={{ ...numberInputStyle(), backgroundColor: '#fffde7', width: '38px' }}
                    />
                  </td>

                  {/* Total (computed, read-only) */}
                  <td style={{ ...S.td, fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                    {subj.total || ''}
                  </td>

                  {/* Historical + computed read-only columns */}
                  {['term2Total','term1Total','sessionAverage','classPosition','classAverage'].map(k => (
                    <td key={k} style={{ ...S.td, color: '#aaa' }}>—</td>
                  ))}

                  {/* Grade (computed) */}
                  <td style={{ ...S.td, fontWeight: 'bold' }}>{subj.subject?.trim() ? subj.grade : ''}</td>
                  {/* Remark (computed) */}
                  <td style={{ ...S.td, fontSize: '8.5px' }}>{subj.subject?.trim() ? subj.remark : ''}</td>

                  {/* Remove row */}
                  <td style={{ ...S.td, padding: '0' }}>
                    <button
                      type="button"
                      onClick={() => removeSubjectRow(idx)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px', fontSize: '12px' }}
                      title="Remove subject"
                    >×</button>
                  </td>
                </tr>
              ))}

              {/* Add row button */}
              <tr>
                <td colSpan={12} style={{ ...S.td, padding: '3px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    style={{ border: '1px dashed #999', background: '#fafafa', cursor: 'pointer', fontSize: '11px', padding: '2px 12px', borderRadius: '3px', color: '#555' }}
                  >
                    + Add Subject
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── AFFECTIVE / PSYCHOMOTOR + GRADE SCALE ──────────────────────── */}
          <div style={S.bottomGrid}>
            {/* Left: Affective Domain */}
            <DomainSection title="AFFECTIVE DOMAIN" skills={AFFECTIVE_SKILLS} />

            {/* Right: Psychomotor + Grade Scale */}
            <div>
              <DomainSection title="PSYCHOMOTOR DOMAIN" skills={PSYCHOMOTOR_SKILLS} />
              <div style={{ ...S.gradeBox, marginTop: '4px' }}>
                <div style={S.gradeHeader}>Grade Scale</div>
                {[
                  { grade: 'A+', range: '95–100%',   desc: 'EXCEPTIONAL' },
                  { grade: 'A',  range: '90–94.9%',  desc: 'DISTINCTION' },
                  { grade: 'A-', range: '85–89.9%',  desc: 'EXCELLENT' },
                  { grade: 'B+', range: '80–84.9%',  desc: 'VERY GOOD' },
                  { grade: 'B',  range: '75–79.9%',  desc: 'VERY GOOD' },
                  { grade: 'B-', range: '70–74.9%',  desc: 'GOOD' },
                  { grade: 'C',  range: '60–69.9%',  desc: 'AVERAGE' },
                  { grade: 'D',  range: '40–59.9%',  desc: 'BELOW AVERAGE' },
                  { grade: 'F',  range: '0–39.9%',   desc: 'FAIL' },
                ].map((g, i) => (
                  <div key={i} style={{ ...S.gradeRow, backgroundColor: i % 2 === 0 ? '#fff' : '#f5f5f5', padding: '1px 0' }}>
                    <span style={{ fontWeight: 'bold', width: '22px', display: 'inline-block' }}>{g.grade}</span>
                    <span style={{ width: '72px', display: 'inline-block' }}>{g.range}</span>
                    <span>{g.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── COMMENTS ───────────────────────────────────────────────────── */}
          <div style={S.commentsGrid}>
            {/* Teacher comment (EDITABLE) */}
            <div style={S.commentBox}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>Class Teacher's Remark</div>
              <textarea
                value={comments.teacher}
                onChange={e => setComments(prev => ({ ...prev, teacher: e.target.value }))}
                rows={3}
                placeholder="Enter your remark..."
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #aaa', resize: 'vertical', fontFamily: '"Times New Roman", Times, serif', fontSize: '10px', fontStyle: 'italic', outline: 'none', backgroundColor: '#fffde7', padding: '2px' }}
              />
              <div style={{ borderTop: '1px solid #000', marginTop: '6px', paddingTop: '2px', fontSize: '9.5px' }}>
                Name: {student.teacher?.name || '___________________________'}
              </div>
            </div>

            {/* Principal comment (left empty for admin to fill) */}
            <div style={S.commentBox}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>Head Teacher's Remark</div>
              <div style={{ minHeight: '44px', fontSize: '10px', fontStyle: 'italic', color: '#aaa' }}>
                (Admin will fill before sending to parent)
              </div>
              <div style={{ borderTop: '1px solid #000', marginTop: '6px', paddingTop: '2px', fontSize: '9.5px' }}>
                Name: {school.principalName || '___________________________'}
              </div>
            </div>
          </div>

          {/* ── STATUS + NEXT TERM DATE ─────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #000', paddingTop: '5px', marginTop: '4px' }}>
            <div>
              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                <strong>Status:</strong>&nbsp;
                <span style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '12px' }}>
                  {parseFloat(percentage) >= 40 ? 'PROMOTED' : 'REPEATED'}
                </span>
              </div>
              <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong>Next Term Begins:</strong>
                <input
                  type="date"
                  value={nextTerm}
                  onChange={e => setNextTerm(e.target.value)}
                  style={{ ...inputStyle('auto'), backgroundColor: '#fffde7', fontSize: '10px' }}
                />
              </div>
            </div>

            <div style={S.ratingBox}>
              <div style={S.ratingHeader}>Rating Indices</div>
              <div>5 - Maintains an Excellent degree of</div>
              <div>&nbsp;&nbsp;&nbsp;Observable (Obs) traits</div>
              <div>4 - Maintains a High level of Obs traits</div>
              <div>3 - Acceptable level of Obs traits</div>
              <div>2 - Shows Minimal regard for Obs traits</div>
              <div>1 - Has No regard for Observable traits</div>
            </div>
          </div>

        </div>{/* end result sheet */}

        {/* ── Bottom save bar ─────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#1e293b', padding: '10px 16px', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={loading || fetching}
            style={{ padding: '7px 18px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} /> {loading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading || fetching}
            style={{ padding: '7px 18px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={15} /> {loading ? 'Submitting...' : 'Submit to Admin'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VisualResultEntry;