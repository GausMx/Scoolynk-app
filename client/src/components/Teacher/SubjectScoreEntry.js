// src/components/Teacher/SubjectScoreEntry.jsx
// Subject teacher's score entry UI.
// Flow: pick class → pick subject → score table → save
// Teachers only see students in their assigned classes and only their assigned subjects.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BookOpen, Save, CheckCircle, AlertCircle, Loader, ChevronDown } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const SubjectScoreEntry = () => {
  const token = localStorage.getItem('accessToken');
  const authHdr = () => `Bearer ${token}`;

  // ── Teacher's assigned subjects + classes ─────────────────────────────────
  const [mySubjects, setMySubjects]   = useState([]);
  const [myClasses,  setMyClasses]    = useState([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedClass,   setSelectedClass]   = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm,    setSelectedTerm]    = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');

  // ── Score table ───────────────────────────────────────────────────────────
  const [rows,        setRows]        = useState([]);  // [{ studentId, name, regNo, ca, exam, total, grade, savedAt }]
  const [loadingRows, setLoadingRows] = useState(false);
  const [dirty,       setDirty]       = useState(false); // unsaved changes

  // ── Feedback ─────────────────────────────────────────────────────────────
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // ── Load teacher's subjects and classes on mount ──────────────────────────
  useEffect(() => {
    axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores/my-subjects`, {
      headers: { Authorization: authHdr() }
    })
    .then(res => {
      setMySubjects(res.data.subjects  || []);
      setMyClasses(res.data.classes    || []);
      setIsClassTeacher(res.data.isClassTeacher || false);
      // Pre-select first options
      if (res.data.subjects?.length)  setSelectedSubject(res.data.subjects[0]);
      if (res.data.classes?.length)   setSelectedClass(res.data.classes[0]._id);
    })
    .catch(err => setError('Failed to load your subjects and classes.'))
    .finally(() => setLoadingMeta(false));
  }, []);

  // ── Load score rows whenever selection changes ────────────────────────────
  const loadScores = useCallback(() => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedSession) return;
    setLoadingRows(true);
    setError('');
    setSuccess('');
    setDirty(false);

    axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores`, {
      headers: { Authorization: authHdr() },
      params: { classId: selectedClass, subject: selectedSubject, term: selectedTerm, session: selectedSession }
    })
    .then(res => setRows(res.data.rows || []))
    .catch(err => setError(err.response?.data?.message || 'Failed to load scores.'))
    .finally(() => setLoadingRows(false));
  }, [selectedClass, selectedSubject, selectedTerm, selectedSession]);

  useEffect(() => { loadScores(); }, [loadScores]);

  // ── Update a cell ─────────────────────────────────────────────────────────
  const updateScore = (studentId, field, rawVal) => {
    const max   = field === 'ca' ? 40 : 60;
    const value = Math.min(max, Math.max(0, Number(rawVal) || 0));
    setRows(prev => prev.map(row =>
      row.studentId.toString() === studentId.toString()
        ? { ...row, [field]: value,
            total: field === 'ca'   ? value + (Number(row.exam) || 0)
                 : field === 'exam' ? (Number(row.ca) || 0) + value
                 : row.total }
        : row
    ));
    setDirty(true);
    setSuccess('');
  };

  // ── Save all scores ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const scores = rows.map(r => ({
      studentId: r.studentId,
      ca:        Number(r.ca)   || 0,
      exam:      Number(r.exam) || 0,
    }));

    try {
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/subject-scores`,
        { classId: selectedClass, subject: selectedSubject, term: selectedTerm, session: selectedSession, scores },
        { headers: { Authorization: authHdr() } }
      );
      setSuccess(`✓ Scores saved for ${res.data.saved} student(s).`);
      setDirty(false);
      loadScores(); // refresh to get server-calculated totals/grades
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scores.');
    } finally {
      setSaving(false);
    }
  };

  // ── Grade badge colour ────────────────────────────────────────────────────
  const gradeColour = (g) => {
    if (!g) return '#999';
    if (g.startsWith('A')) return '#16a34a';
    if (g.startsWith('B')) return '#2563eb';
    if (g === 'C')         return '#0891b2';
    if (g === 'D')         return '#d97706';
    return '#dc2626';
  };

  if (loadingMeta) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px', color:'#555' }}>
        <Loader size={24} style={{ marginRight:8, animation:'spin 1s linear infinite' }} />
        Loading your subjects…
      </div>
    );
  }

  if (mySubjects.length === 0) {
    return (
      <div style={{ padding:'32px', maxWidth:600, margin:'0 auto' }}>
        <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:8, padding:'20px' }}>
          <AlertCircle size={20} style={{ marginRight:8, color:'#856404' }} />
          <strong>No subjects assigned.</strong>
          <p style={{ margin:'8px 0 0', color:'#555', fontSize:14 }}>
            Ask your admin to assign you to a subject and class before you can enter scores.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived totals for summary bar ────────────────────────────────────────
  const filled = rows.filter(r => r.ca !== '' && r.exam !== '').length;

  return (
    <div style={{ fontFamily:'inherit', background:'#f8fafc', minHeight:'100vh' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background:'#1e293b', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', gap:10 }}>
        <BookOpen size={22} />
        <div>
          <div style={{ fontWeight:700, fontSize:16 }}>Subject Score Entry</div>
          <div style={{ fontSize:12, opacity:.7 }}>Enter CA and exam scores for your subject</div>
        </div>
        {dirty && (
          <div style={{ marginLeft:'auto', background:'#f59e0b', color:'#fff', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:600 }}>
            Unsaved changes
          </div>
        )}
      </div>

      {/* ── Selection controls ─────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'16px 24px', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>

        {/* Class */}
        <SelectField label="Class" value={selectedClass} onChange={v => setSelectedClass(v)}>
          {myClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </SelectField>

        {/* Subject */}
        <SelectField label="Subject" value={selectedSubject} onChange={v => setSelectedSubject(v)}>
          {mySubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </SelectField>

        {/* Term */}
        <SelectField label="Term" value={selectedTerm} onChange={v => setSelectedTerm(v)}>
          <option value="First Term">First Term</option>
          <option value="Second Term">Second Term</option>
          <option value="Third Term">Third Term</option>
        </SelectField>

        {/* Session */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:.5 }}>Session</label>
          <input
            value={selectedSession}
            onChange={e => setSelectedSession(e.target.value)}
            placeholder="2024/2025"
            style={{ border:'1px solid #d1d5db', borderRadius:6, padding:'6px 10px', fontSize:13, width:100 }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || loadingRows || rows.length === 0}
          style={{
            marginLeft:'auto', background: saving ? '#94a3b8' : '#16a34a',
            color:'#fff', border:'none', borderRadius:8, padding:'8px 20px',
            fontWeight:600, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap:6,
          }}
        >
          {saving
            ? <><Loader size={16} /> Saving…</>
            : <><Save size={16} /> Save Scores</>
          }
        </button>
      </div>

      {/* ── Feedback ───────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 24px' }}>
        {error   && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
      </div>

      {/* ── Summary bar ────────────────────────────────────────────────────── */}
      {rows.length > 0 && !loadingRows && (
        <div style={{ padding:'8px 24px', display:'flex', gap:24, fontSize:13, color:'#64748b' }}>
          <span><strong style={{ color:'#1e293b' }}>{rows.length}</strong> students</span>
          <span><strong style={{ color:'#16a34a' }}>{filled}</strong> scores entered</span>
          <span><strong style={{ color:'#f59e0b' }}>{rows.length - filled}</strong> remaining</span>
        </div>
      )}

      {/* ── Score table ────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 24px 40px' }}>
        {loadingRows ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>
            <Loader size={24} style={{ animation:'spin 1s linear infinite' }} />
            <div style={{ marginTop:8 }}>Loading students…</div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'40px', textAlign:'center', color:'#64748b', marginTop:16 }}>
            No students found in this class.
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', marginTop:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr style={{ background:'#f1f5f9', borderBottom:'2px solid #e2e8f0' }}>
                  <Th>#</Th>
                  <Th align="left">Student Name</Th>
                  <Th>Reg No</Th>
                  <Th>CA <span style={{ fontWeight:400, fontSize:11 }}>(max 40)</span></Th>
                  <Th>Exam <span style={{ fontWeight:400, fontSize:11 }}>(max 60)</span></Th>
                  <Th>Total</Th>
                  <Th>Grade</Th>
                  <Th>Last Saved</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const liveTotal = (Number(row.ca) || 0) + (Number(row.exam) || 0);
                  const hasScore  = row.ca !== '' || row.exam !== '';
                  return (
                    <tr
                      key={row.studentId}
                      style={{
                        borderBottom:'1px solid #f1f5f9',
                        background: hasScore ? '#fff' : '#fffbeb',
                      }}
                    >
                      <Td center>{idx + 1}</Td>
                      <Td><span style={{ fontWeight:600 }}>{row.name}</span></Td>
                      <Td center><span style={{ fontSize:12, color:'#64748b' }}>{row.regNo}</span></Td>
                      {/* CA input */}
                      <Td center>
                        <input
                          type="number"
                          min={0} max={40}
                          value={row.ca === '' ? '' : row.ca}
                          onChange={e => updateScore(row.studentId, 'ca', e.target.value)}
                          style={scoreInputStyle(row.ca, 40)}
                          placeholder="—"
                        />
                      </Td>
                      {/* Exam input */}
                      <Td center>
                        <input
                          type="number"
                          min={0} max={60}
                          value={row.exam === '' ? '' : row.exam}
                          onChange={e => updateScore(row.studentId, 'exam', e.target.value)}
                          style={scoreInputStyle(row.exam, 60)}
                          placeholder="—"
                        />
                      </Td>
                      {/* Total */}
                      <Td center>
                        <span style={{ fontWeight:700, color: liveTotal >= 50 ? '#16a34a' : liveTotal >= 40 ? '#d97706' : '#dc2626' }}>
                          {hasScore ? liveTotal : '—'}
                        </span>
                      </Td>
                      {/* Grade */}
                      <Td center>
                        {hasScore
                          ? <span style={{ background: gradeColour(row.grade), color:'#fff', borderRadius:4, padding:'2px 8px', fontWeight:700, fontSize:12 }}>
                              {row.grade || '—'}
                            </span>
                          : <span style={{ color:'#cbd5e1' }}>—</span>
                        }
                      </Td>
                      {/* Last saved */}
                      <Td center>
                        <span style={{ fontSize:11, color:'#94a3b8' }}>
                          {row.savedAt ? new Date(row.savedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating save bar when there are unsaved changes */}
        {dirty && rows.length > 0 && (
          <div style={{
            position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
            background:'#1e293b', color:'#fff', borderRadius:12, padding:'12px 24px',
            display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,.3)',
            zIndex:999,
          }}>
            <span style={{ fontSize:14 }}>You have unsaved changes</span>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'8px 20px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            >
              {saving ? <Loader size={16} /> : <Save size={16} />}
              Save Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const SelectField = ({ label, value, onChange, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    <label style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
    <div style={{ position:'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ appearance:'none', border:'1px solid #d1d5db', borderRadius:6, padding:'6px 28px 6px 10px', fontSize:13, background:'#fff', cursor:'pointer' }}
      >
        {children}
      </select>
      <ChevronDown size={14} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#64748b' }} />
    </div>
  </div>
);

const Th = ({ children, align = 'center' }) => (
  <th style={{ padding:'10px 12px', textAlign: align, fontSize:12, fontWeight:600, color:'#475569', whiteSpace:'nowrap' }}>{children}</th>
);
const Td = ({ children, center }) => (
  <td style={{ padding:'10px 12px', textAlign: center ? 'center' : 'left', verticalAlign:'middle' }}>{children}</td>
);

const scoreInputStyle = (val, max) => ({
  width:60, textAlign:'center', border:'1px solid',
  borderColor: val === '' ? '#e2e8f0' : Number(val) > max ? '#dc2626' : '#cbd5e1',
  borderRadius:6, padding:'4px 6px', fontSize:13,
  background: val === '' ? '#f8fafc' : '#fff',
  outline:'none',
});

const Alert = ({ type, children }) => (
  <div style={{
    margin:'12px 0 0', padding:'10px 14px', borderRadius:8, fontSize:13,
    display:'flex', alignItems:'center', gap:8,
    background: type === 'error' ? '#fef2f2' : '#f0fdf4',
    color:       type === 'error' ? '#991b1b' : '#166534',
    border:      `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`,
  }}>
    {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
    {children}
  </div>
);

export default SubjectScoreEntry;