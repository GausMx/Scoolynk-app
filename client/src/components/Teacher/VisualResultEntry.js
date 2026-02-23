// src/components/Teacher/VisualResultEntry.js
// Teacher fills results directly ON the real Nigerian result sheet.
// Branding fetched from /api/school/branding — works for any role (admin/teacher).
// Student fields: read-only if already populated from DB; editable if blank.

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

// ─── Shared input style helpers ───────────────────────────────────────────────
const BASE_FONT = '"Times New Roman", Times, serif';

const inputStyle = (width = '100%', align = 'left', extra = {}) => ({
  width, border: 'none', borderBottom: '1px solid #aaa',
  background: 'transparent', outline: 'none',
  fontFamily: BASE_FONT, fontSize: '10px', color: '#000',
  padding: '0 1px', textAlign: align, ...extra,
});

const numInput = (extra = {}) => ({
  ...inputStyle('100%', 'center'),
  MozAppearance: 'textfield', ...extra,
});

const EDITABLE_BG   = { backgroundColor: '#fffde7' }; // yellow = teacher edits this
const READONLY_BG   = { backgroundColor: 'transparent' };
const COMPUTED_BG   = { backgroundColor: '#f0f0f0' };  // grey = auto-calculated

// ─── 16 trait definitions ─────────────────────────────────────────────────────
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
  { label: 'Handling Of Tools', key: 'handlingOfTools' },
  { label: 'Drawing/Painting',  key: 'drawingPainting' },
  { label: 'Handwriting',       key: 'handwriting' },
  { label: 'Public Speaking',   key: 'publicSpeaking' },
  { label: 'Speech Fluency',    key: 'speechFluency' },
  { label: 'Sports & Games',    key: 'sportsGames' },
];
const ALL_TRAITS = [...AFFECTIVE_SKILLS, ...PSYCHOMOTOR_SKILLS];

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
  // ── School branding ──────────────────────────────────────────────────────────
  const [school,   setSchool]   = useState({ name:'', address:'', phone:'', email:'', motto:'', logoBase64:'', principalName:'' });
  const [fetching, setFetching] = useState(true);

  // ── Editable student extras (teacher fills if blank in DB) ───────────────────
  const [extras, setExtras] = useState({ gender:'', dob:'', club:'' });

  // ── Result data ──────────────────────────────────────────────────────────────
  const [subjects,   setSubjects]   = useState([]);
  const [traits,     setTraits]     = useState({});
  const [attendance, setAttendance] = useState({ opened:'', present:'', absent:'' });
  const [comments,   setComments]   = useState({ teacher:'', principal:'' });
  const [termBegins, setTermBegins] = useState('');
  const [termEnds,   setTermEnds]   = useState('');
  const [nextTerm,   setNextTerm]   = useState('');
  const [classSize,  setClassSize]  = useState('');

  // ── UI ───────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const authHdr = useCallback(
    () => (!token ? '' : token.startsWith('Bearer ') ? token : `Bearer ${token}`),
    [token]
  );

  // ── 1. Fetch branding from /api/school/branding (works for teachers too) ─────
  useEffect(() => {
    if (!token) { setError('Authentication token missing.'); setFetching(false); return; }
    axios.get(`${REACT_APP_API_URL}/api/teacher/school-branding`, {
      headers: { Authorization: authHdr() },
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
    .catch(err => console.error('[VisualResultEntry] Branding fetch failed:', err.message))
    .finally(() => setFetching(false));
  }, [token, authHdr]);

  // ── 2. Initialise from existingResult or template ────────────────────────────
  const defaultTraits = useCallback(() => {
    const t = {};
    ALL_TRAITS.forEach(s => { t[s.key] = 0; });
    return t;
  }, []);

  const buildEmptySubjects = useCallback(() => {
    // Flat subjects array (new VisualTemplateBuilder format)
    const flat = template?.components?.subjects;
    if (Array.isArray(flat) && flat.length) {
      return flat.map(s => ({
        subject: typeof s === 'string' ? s : (s.name || s.subject || ''),
        ca: 0, exam: 0,
      }));
    }
    // Legacy scoresTable.subjects fallback
    const legacy = template?.components?.scoresTable?.subjects;
    if (Array.isArray(legacy) && legacy.length) {
      return legacy.map(s => ({
        subject: typeof s === 'string' ? s : (s.name || s.subject || ''),
        ca: 0, exam: 0,
      }));
    }
    const n = template?.components?.scoresTable?.defaultSubjects || 12;
    return Array.from({ length: n }, () => ({ subject:'', ca:0, exam:0 }));
  }, [template]);

  useEffect(() => {
    // Pre-fill teacher-editable student extras from DB values
    setExtras({
      gender: student?.gender || '',
      dob:    student?.dob    || '',
      club:   student?.club   || '',
    });

    if (existingResult) {
      const s = (existingResult.subjects || []).map(sub => ({
        subject: sub.subject || '',
        ca:   sub.ca   ?? sub.ca1 ?? 0,
        exam: sub.exam ?? 0,
      }));
      setSubjects(s.length ? s : buildEmptySubjects());
      setTraits(existingResult.affectiveTraits || defaultTraits());
      setAttendance(existingResult.attendance   || { opened:'', present:'', absent:'' });
      setComments(existingResult.comments       || { teacher:'', principal:'' });
      setTermBegins(existingResult.termBegins   || '');
      setTermEnds(existingResult.termEnds       || '');
      setNextTerm(existingResult.nextTermResumption || '');
      setClassSize(existingResult.classSize     || '');
      if (existingResult.studentExtras) {
        setExtras(prev => ({
          gender: prev.gender || existingResult.studentExtras.gender || '',
          dob:    prev.dob    || existingResult.studentExtras.dob    || '',
          club:   prev.club   || existingResult.studentExtras.club   || '',
        }));
      }
      return;
    }

    setSubjects(buildEmptySubjects());
    setTraits(defaultTraits());
    // Pre-fill term dates from template if set
    if (template?.components?.termBegins)     setTermBegins(template.components.termBegins);
    if (template?.components?.termEnds)       setTermEnds(template.components.termEnds);
    if (template?.components?.nextTermBegins) setNextTerm(template.components.nextTermBegins);
    if (template?.components?.classSize)      setClassSize(String(template.components.classSize));
  }, [existingResult, template, student, buildEmptySubjects, defaultTraits]);

  // ── Subject helpers ───────────────────────────────────────────────────────────
  const updateSubject = (idx, field, raw) => {
    const val = field === 'subject'
      ? raw
      : Math.min(field === 'ca' ? 40 : 60, Math.max(0, Number(raw) || 0));
    setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };
  const addRow    = () => setSubjects(prev => [...prev, { subject:'', ca:0, exam:0 }]);
  const removeRow = (idx) => setSubjects(prev => prev.filter((_, i) => i !== idx));

  // ── Trait click ───────────────────────────────────────────────────────────────
  const setTrait = (key, n) =>
    setTraits(prev => ({ ...prev, [key]: prev[key] === n ? 0 : n }));

  // ── Computed ──────────────────────────────────────────────────────────────────
  const computed      = subjects.map(s => {
    const total = Math.min(100, (Number(s.ca)||0) + (Number(s.exam)||0));
    return { ...s, total, ...getNigerianGrade(total) };
  });
  const validRows     = computed.filter(s => s.subject?.trim());
  const totalObtain   = validRows.length * 100;
  const totalObtained = validRows.reduce((a, s) => a + s.total, 0);
  const pct           = totalObtain > 0 ? ((totalObtained / totalObtain) * 100).toFixed(1) : '0.0';
  const overallGrade  = getNigerianGrade(parseFloat(pct));

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async (submitToAdmin = false) => {
    setError('');
    if (!token)        { setError('Authentication token missing.'); return; }
    if (!validRows.length) { setError('Please enter at least one subject name.'); return; }

    const payload = {
      studentId:          student._id,
      term, session,
      subjects:           validRows.map(({ subject, ca, exam, total }) => ({ subject, ca, exam, total })),
      affectiveTraits:    traits,
      attendance:         { opened: Number(attendance.opened)||0, present: Number(attendance.present)||0, absent: Number(attendance.absent)||0 },
      comments,
      studentExtras:      { gender: extras.gender||undefined, dob: extras.dob||undefined, club: extras.club||undefined },
      termBegins:         termBegins || undefined,
      termEnds:           termEnds   || undefined,
      nextTermResumption: nextTerm   || undefined,
      classSize:          classSize  ? Number(classSize) : undefined,
      status:             submitToAdmin ? 'submitted' : 'draft',
    };
    if (existingResult) payload.resultId = existingResult._id;

    try {
      setLoading(true);
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/results`, payload,
        { headers: { Authorization: authHdr(), 'Content-Type': 'application/json' } }
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

  if (!template) {
    return (
      <div className="alert alert-warning m-3 d-flex align-items-center gap-2">
        <AlertCircle size={20} />
        No template found for {term}, {session}. Ask your admin to create one.
      </div>
    );
  }

  // ─── Sheet styles ─────────────────────────────────────────────────────────────
  const S = {
    page: { fontFamily: BASE_FONT, fontSize:'11px', color:'#000', backgroundColor:'#fff', maxWidth:'900px', margin:'0 auto', padding:'12px 16px', border:'2px solid #000', boxSizing:'border-box' },
    hdr: { display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginBottom:'6px', paddingBottom:'6px', borderBottom:'2px solid #000' },
    banner: { textAlign:'center', fontWeight:'bold', fontSize:'13px', border:'1px solid #000', padding:'3px 0', margin:'5px 0', backgroundColor:'#f0f0f0', textTransform:'uppercase' },
    topBand: { display:'grid', gridTemplateColumns:'2fr 1fr 1fr', border:'1px solid #000', marginBottom:'4px' },
    cell: { padding:'3px 5px', borderRight:'1px solid #000' },
    cellLast: { padding:'3px 5px' },
    secTitle: { fontWeight:'bold', textAlign:'center', borderBottom:'1px solid #ccc', marginBottom:'3px', paddingBottom:'2px', fontSize:'10px' },
    bioPair: { display:'flex', marginBottom:'2px', gap:'4px', alignItems:'center' },
    bioLbl: { fontWeight:'bold', fontSize:'10px', whiteSpace:'nowrap' },
    attGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', textAlign:'center', marginTop:'2px' },
    attCol: { borderRight:'1px solid #ccc', padding:'1px 0' },
    attLbl: { fontSize:'9px', borderBottom:'1px solid #ccc' },
    sumGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', fontSize:'10px' },
    table: { width:'100%', borderCollapse:'collapse', marginBottom:'4px', fontSize:'10px' },
    th: { border:'1px solid #000', padding:'2px 3px', textAlign:'center', backgroundColor:'#e8e8e8', fontWeight:'bold', fontSize:'9px' },
    td: { border:'1px solid #000', padding:'1px 2px', textAlign:'center' },
    tdL: { border:'1px solid #000', padding:'1px 4px', textAlign:'left' },
    botGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', marginBottom:'4px' },
    domBox: { border:'1px solid #000' },
    domHdr: { backgroundColor:'#e8e8e8', fontWeight:'bold', textAlign:'center', padding:'2px', fontSize:'10px', borderBottom:'1px solid #000' },
    domScaleHdr: { display:'flex', backgroundColor:'#e8e8e8', borderBottom:'1px solid #000', fontSize:'9px' },
    domScaleLbl: { flex:3, padding:'1px 4px', borderRight:'1px solid #000' },
    domScaleCols: { flex:2, display:'flex' },
    domScaleCol: { flex:1, textAlign:'center', borderRight:'1px solid #ccc', padding:'1px 0', fontWeight:'bold' },
    domRow: { display:'flex', borderBottom:'1px solid #e0e0e0', fontSize:'9.5px' },
    domRowLbl: { flex:3, padding:'1px 4px', borderRight:'1px solid #000' },
    domRowCols: { flex:2, display:'flex' },
    domRowCol: { flex:1, textAlign:'center', borderRight:'1px solid #ccc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold', cursor:'pointer', userSelect:'none', minHeight:'14px' },
    cGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', marginBottom:'4px' },
    cBox: { border:'1px solid #000', padding:'4px' },
    gradeBox: { border:'1px solid #000', padding:'4px', fontSize:'9.5px' },
    gradeHdr: { fontWeight:'bold', textAlign:'center', borderBottom:'1px solid #000', marginBottom:'3px', paddingBottom:'2px', fontSize:'10px' },
    gradeRow: { display:'flex', justifyContent:'space-between', marginBottom:'1px' },
    ratingBox: { border:'1px solid #000', padding:'4px', fontSize:'9px' },
  };

  const TraitRow = ({ skill, odd }) => {
    const val = traits[skill.key] || 0;
    return (
      <div style={{ ...S.domRow, backgroundColor: odd ? '#fafafa' : '#fff' }}>
        <div style={S.domRowLbl}>{skill.label}</div>
        <div style={S.domRowCols}>
          {[5,4,3,2,1].map(n => (
            <div key={n}
              style={{ ...S.domRowCol, backgroundColor: val===n ? '#1e293b' : 'transparent', color: val===n ? '#fff' : '#000' }}
              onClick={() => setTrait(skill.key, n)}
              title={`${skill.label} = ${n}`}
            >
              {val === n ? '✓' : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DomainSection = ({ title, skills }) => (
    <div style={S.domBox}>
      <div style={S.domHdr}>{title}</div>
      <div style={S.domScaleHdr}>
        <div style={S.domScaleLbl}>Traits</div>
        <div style={S.domScaleCols}>
          {[5,4,3,2,1].map(n => <div key={n} style={S.domScaleCol}>{n}</div>)}
        </div>
      </div>
      {skills.map((sk, i) => <TraitRow key={sk.key} skill={sk} odd={i%2!==0} />)}
    </div>
  );

  const Btn = ({ onClick, disabled, bg, children }) => (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:'6px 14px', backgroundColor:bg, color:'#fff', border:'none', borderRadius:'6px',
        cursor: disabled ? 'not-allowed':'pointer', fontWeight:'bold', fontSize:'13px',
        display:'flex', alignItems:'center', gap:'6px', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.65)', zIndex:1050, overflowY:'auto', padding:'12px' }}>
      <div style={{ maxWidth:'960px', margin:'0 auto' }}>

        {/* Sticky toolbar */}
        <div style={{ position:'sticky', top:0, zIndex:20, backgroundColor:'#1e293b', color:'#fff',
          padding:'10px 16px', borderRadius:'8px 8px 0 0',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
          <div>
            <div style={{ fontWeight:'bold', fontSize:'15px' }}>{student?.name} — Result Entry</div>
            <div style={{ fontSize:'12px', opacity:0.65 }}>{term}, {session} · Fill directly on the sheet below</div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <Btn onClick={() => handleSave(false)} disabled={loading||fetching} bg="#3b82f6">
              <Save size={15}/>{loading ? 'Saving…':'Save Draft'}
            </Btn>
            <Btn onClick={() => handleSave(true)} disabled={loading||fetching} bg="#16a34a">
              <Send size={15}/>{loading ? 'Submitting…':'Submit to Admin'}
            </Btn>
            <Btn onClick={onClose} disabled={loading} bg="rgba(255,255,255,0.15)">
              <X size={16}/>
            </Btn>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ backgroundColor:'#fee2e2', color:'#991b1b', padding:'8px 14px',
            borderLeft:'4px solid #dc2626', fontSize:'13px', display:'flex', gap:'8px', alignItems:'center' }}>
            <AlertCircle size={16}/> {error}
          </div>
        )}

        {/* Tip strip */}
        <div style={{ backgroundColor:'#fffbeb', borderLeft:'4px solid #f59e0b', padding:'6px 14px', fontSize:'12px', color:'#92400e' }}>
          💡 <strong>Yellow cells</strong> are editable. Click 5–1 columns to rate traits. Totals calculate automatically.
          {fetching && <span style={{ marginLeft:'10px', color:'#555' }}>⏳ Loading school branding…</span>}
        </div>

        {/* ═══ RESULT SHEET ═══ */}
        <div style={S.page}>

          {/* HEADER */}
          <div style={S.hdr}>
            {school.logoBase64 ? (
              <img src={school.logoBase64} alt="School Logo"
                style={{ width:72, height:72, objectFit:'contain', flexShrink:0 }} />
            ) : (
              <div style={{ width:72, height:72, border:'1px dashed #bbb', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'9px', color:'#aaa', textAlign:'center', lineHeight:'1.3' }}>
                {fetching ? '…' : 'No Logo\n(Settings →\nBranding)'}
              </div>
            )}

            <div style={{ flex:1, textAlign:'center' }}>
              {school.name ? (
                <div style={{ fontSize:'22px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px' }}>
                  {school.name}
                </div>
              ) : (
                <div style={{ fontSize:'13px', color:'#999', fontStyle:'italic' }}>
                  {fetching ? 'Loading…' : 'School name not set — go to Settings → Branding'}
                </div>
              )}
              {school.motto   && <div style={{ fontSize:'11px', fontStyle:'italic' }}>Motto: {school.motto}</div>}
              {school.address && <div style={{ fontSize:'9.5px' }}>{school.address}</div>}
              {(school.phone||school.email) && (
                <div style={{ fontSize:'9.5px' }}>
                  {school.phone && `Tel: ${school.phone}`}
                  {school.phone && school.email && ' | '}
                  {school.email && `Email: ${school.email}`}
                </div>
              )}
            </div>

            {student?.passportBase64 ? (
              <img src={student.passportBase64} alt="Passport"
                style={{ width:68, height:80, objectFit:'cover', border:'1px solid #000', flexShrink:0 }} />
            ) : (
              <div style={{ width:68, height:80, border:'1px solid #000', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'8px', color:'#aaa', textAlign:'center', flexDirection:'column' }}>
                <span style={{ fontSize:20 }}>👤</span><span>Passport<br/>Photo</span>
              </div>
            )}
          </div>

          {/* SESSION BANNER */}
          <div style={S.banner}>
            {session} — {(term||'').toUpperCase()} PUPIL'S PERFORMANCE REPORT
          </div>

          {/* TOP BAND */}
          <div style={S.topBand}>

            {/* PERSONAL DATA */}
            <div style={S.cell}>
              <div style={S.secTitle}>PERSONAL DATA</div>

              {/* NAME — always read-only */}
              <div style={S.bioPair}>
                <span style={S.bioLbl}>NAME:</span>
                <span style={{ fontSize:'10px' }}>{student?.name || '—'}</span>
              </div>

              {/* ADMIN NO — read-only */}
              <div style={S.bioPair}>
                <span style={S.bioLbl}>ADMIN NO:</span>
                <span style={{ fontSize:'10px' }}>{student?.admNo || student?.regNo || '—'}</span>
              </div>

              {/* GENDER — editable if not in DB */}
              <div style={S.bioPair}>
                <span style={S.bioLbl}>GENDER:</span>
                {student?.gender ? (
                  <span style={{ fontSize:'10px' }}>{student.gender}</span>
                ) : (
                  <select
                    value={extras.gender}
                    onChange={e => setExtras(p => ({ ...p, gender: e.target.value }))}
                    style={{ ...inputStyle('auto'), ...EDITABLE_BG, fontSize:'10px' }}
                  >
                    <option value="">— select —</option>
                    <option>Male</option><option>Female</option>
                  </select>
                )}
              </div>

              {/* CLASS — read-only */}
              <div style={S.bioPair}>
                <span style={S.bioLbl}>CLASS:</span>
                <span style={{ fontSize:'10px' }}>{student?.classId?.name || student?.className || '—'}</span>
              </div>

              {/* DOB — editable if not in DB */}
              <div style={S.bioPair}>
                <span style={S.bioLbl}>D.O.B:</span>
                {student?.dob ? (
                  <span style={{ fontSize:'10px' }}>{student.dob}</span>
                ) : (
                  <input type="date"
                    value={extras.dob}
                    onChange={e => setExtras(p => ({ ...p, dob: e.target.value }))}
                    style={{ ...inputStyle('auto'), ...EDITABLE_BG, fontSize:'9px' }}
                  />
                )}
              </div>

              {/* CLUB — editable if not in DB */}
              <div style={S.bioPair}>
                <span style={S.bioLbl}>CLUB/SOCIETY:</span>
                {student?.club ? (
                  <span style={{ fontSize:'10px' }}>{student.club}</span>
                ) : (
                  <input type="text"
                    value={extras.club}
                    onChange={e => setExtras(p => ({ ...p, club: e.target.value }))}
                    placeholder="e.g. Science Club"
                    style={{ ...inputStyle('100%'), ...EDITABLE_BG }}
                  />
                )}
              </div>
            </div>

            {/* ATTENDANCE + TERM DATES */}
            <div style={S.cell}>
              <div style={S.secTitle}>ATTENDANCE</div>
              <div style={S.attGrid}>
                {[['No of Times\nSchool Opened','opened'],['No of Times\nPresent','present'],['No of Times\nAbsent','absent']].map(([lbl,key],i) => (
                  <div key={key} style={{ ...S.attCol, borderRight: i<2 ? '1px solid #ccc' : 'none' }}>
                    <div style={S.attLbl}>{lbl}</div>
                    <input type="number" min={0}
                      value={attendance[key]}
                      onChange={e => setAttendance(p => ({ ...p, [key]: e.target.value }))}
                      style={{ ...numInput(), fontSize:'13px', fontWeight:'bold', ...EDITABLE_BG }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop:'6px', fontWeight:'bold', textAlign:'center', borderTop:'1px solid #ccc', paddingTop:'3px', fontSize:'10px' }}>
                TERMINAL DURATION
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9.5px', marginTop:'2px', gap:'4px' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'bold' }}>Term Beginning</div>
                  <input type="date" value={termBegins} onChange={e => setTermBegins(e.target.value)}
                    style={{ ...inputStyle('100%'), ...EDITABLE_BG, fontSize:'9px' }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'bold' }}>Term Ending</div>
                  <input type="date" value={termEnds} onChange={e => setTermEnds(e.target.value)}
                    style={{ ...inputStyle('100%'), ...EDITABLE_BG, fontSize:'9px' }} />
                </div>
              </div>
            </div>

            {/* PERFORMANCE SUMMARY */}
            <div style={S.cellLast}>
              <div style={S.secTitle}>PERFORMANCE SUMMARY</div>
              <div style={S.sumGrid}>
                {[
                  ['Total Score Obtainable', totalObtain],
                  ['Total Score Obtained',   totalObtained],
                  ['%TAGE',                  `${pct}%`],
                  ['GRADE',                  overallGrade.grade],
                  ['POSITION',               '—'],
                ].map(([lbl, val]) => (
                  <React.Fragment key={lbl}>
                    <div style={{ fontWeight:'bold', fontSize:'10px' }}>{lbl}</div>
                    <div style={{ fontWeight: lbl==='GRADE' ? 'bold':'normal', fontSize:'10px' }}>{val}</div>
                  </React.Fragment>
                ))}
                <div style={{ fontWeight:'bold', fontSize:'10px' }}>CLASS SIZE</div>
                <div>
                  <input type="number" min={1}
                    value={classSize}
                    onChange={e => setClassSize(e.target.value)}
                    style={{ ...numInput(), ...EDITABLE_BG, width:'50px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COGNITIVE DOMAIN TABLE */}
          <div style={{ fontWeight:'bold', textAlign:'center', backgroundColor:'#d8d8d8', border:'1px solid #000', borderBottom:'none', padding:'2px', fontSize:'11px' }}>
            COGNITIVE DOMAIN
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width:'20%', textAlign:'left' }} rowSpan={2}>SUBJECTS</th>
                {['C.A.','EXAM','TOTAL','2ND TERM','1ST TERM','SESSION AVG','CLASS POS.','CLASS AVG','GRADE','REMARKS',''].map((h,i) => (
                  <th key={i} style={{ ...S.th, width: i===10 ? '22px':undefined }}>{h}</th>
                ))}
              </tr>
              <tr>
                {['40','60','100','100','100','100','','','','',''].map((v,i) => (
                  <th key={i} style={S.th}>{v}</th>
                ))}
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {computed.map((subj, idx) => (
                <tr key={idx} style={{ backgroundColor: idx%2===0 ? '#fff':'#f9f9f9' }}>
                  <td style={S.tdL}>
                    <input type="text" value={subj.subject}
                      onChange={e => updateSubject(idx, 'subject', e.target.value)}
                      style={{ ...inputStyle('100%','left'), ...EDITABLE_BG, textTransform:'uppercase' }}
                      placeholder="Subject name"
                    />
                  </td>
                  <td style={S.td}>
                    <input type="number" min={0} max={40}
                      value={subj.ca}
                      onChange={e => updateSubject(idx, 'ca', e.target.value)}
                      style={{ ...numInput(), ...EDITABLE_BG, width:'38px' }}
                    />
                  </td>
                  <td style={S.td}>
                    <input type="number" min={0} max={60}
                      value={subj.exam}
                      onChange={e => updateSubject(idx, 'exam', e.target.value)}
                      style={{ ...numInput(), ...EDITABLE_BG, width:'38px' }}
                    />
                  </td>
                  <td style={{ ...S.td, fontWeight:'bold', ...COMPUTED_BG }}>{subj.total || ''}</td>
                  {[subj.term2Total, subj.term1Total, subj.sessionAverage, subj.classPosition, subj.classAverage].map((v,i) => (
                    <td key={i} style={{ ...S.td, color:'#aaa' }}>{v || '—'}</td>
                  ))}
                  <td style={{ ...S.td, fontWeight:'bold' }}>{subj.subject?.trim() ? subj.grade : ''}</td>
                  <td style={{ ...S.td, fontSize:'8.5px' }}>{subj.subject?.trim() ? subj.remark : ''}</td>
                  <td style={{ ...S.td, padding:0 }}>
                    <button type="button" onClick={() => removeRow(idx)}
                      style={{ border:'none', background:'none', cursor:'pointer', color:'#dc2626', padding:'2px 4px', fontSize:'12px' }}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={12} style={{ ...S.td, padding:'3px', textAlign:'center' }}>
                  <button type="button" onClick={addRow}
                    style={{ border:'1px dashed #999', background:'#fafafa', cursor:'pointer', fontSize:'11px', padding:'2px 14px', borderRadius:'3px', color:'#555' }}>
                    + Add Subject
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* AFFECTIVE / PSYCHOMOTOR + GRADE SCALE */}
          <div style={S.botGrid}>
            <DomainSection title="AFFECTIVE DOMAIN"    skills={AFFECTIVE_SKILLS} />
            <div>
              <DomainSection title="PSYCHOMOTOR DOMAIN" skills={PSYCHOMOTOR_SKILLS} />
              <div style={{ ...S.gradeBox, marginTop:'4px' }}>
                <div style={S.gradeHdr}>Grade Scale</div>
                {[['A+','95–100%','EXCEPTIONAL'],['A','90–94.9%','DISTINCTION'],
                  ['A-','85–89.9%','EXCELLENT'],['B+','80–84.9%','VERY GOOD'],
                  ['B','75–79.9%','VERY GOOD'],['B-','70–74.9%','GOOD'],
                  ['C','60–69.9%','AVERAGE'],['D','40–59.9%','BELOW AVERAGE'],
                  ['F','0–39.9%','FAIL'],
                ].map(([g,r,d],i) => (
                  <div key={i} style={{ ...S.gradeRow, backgroundColor: i%2===0?'#fff':'#f5f5f5', padding:'1px 0' }}>
                    <span style={{ fontWeight:'bold', width:'22px', display:'inline-block' }}>{g}</span>
                    <span style={{ width:'72px', display:'inline-block' }}>{r}</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COMMENTS — both editable by teacher; admin can update principal comment later */}
          <div style={S.cGrid}>
            <div style={S.cBox}>
              <div style={{ fontWeight:'bold', fontSize:'10px', marginBottom:'2px' }}>Class Teacher's Remark</div>
              <textarea
                value={comments.teacher}
                onChange={e => setComments(p => ({ ...p, teacher: e.target.value }))}
                rows={3}
                placeholder="Enter your remark about this student's performance…"
                style={{ width:'100%', border:'none', borderBottom:'1px solid #aaa', resize:'vertical',
                  fontFamily: BASE_FONT, fontSize:'10px', fontStyle:'italic', outline:'none', ...EDITABLE_BG, padding:'2px' }}
              />
              <div style={{ borderTop:'1px solid #000', marginTop:'6px', paddingTop:'2px', fontSize:'9.5px' }}>
                Name/Sign: ___________________________
              </div>
            </div>
            <div style={S.cBox}>
              <div style={{ fontWeight:'bold', fontSize:'10px', marginBottom:'2px' }}>Head Teacher's Remark</div>
              <textarea
                value={comments.principal}
                onChange={e => setComments(p => ({ ...p, principal: e.target.value }))}
                rows={3}
                placeholder="(Optional — admin can also update before sending to parent)"
                style={{ width:'100%', border:'none', borderBottom:'1px solid #aaa', resize:'vertical',
                  fontFamily: BASE_FONT, fontSize:'10px', fontStyle:'italic', outline:'none', ...EDITABLE_BG, padding:'2px' }}
              />
              <div style={{ borderTop:'1px solid #000', marginTop:'6px', paddingTop:'2px', fontSize:'9.5px' }}>
                Name: {school.principalName || '___________________________'}
              </div>
            </div>
          </div>

          {/* STATUS + NEXT TERM */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderTop:'1px solid #000', paddingTop:'5px', marginTop:'4px' }}>
            <div>
              <div style={{ fontSize:'11px', marginBottom:'4px' }}>
                <strong>Status:</strong>{' '}
                <span style={{ fontWeight:'bold', textDecoration:'underline', fontSize:'12px' }}>
                  {parseFloat(pct) >= 40 ? 'PROMOTED' : 'REPEATED'}
                </span>
              </div>
              <div style={{ fontSize:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
                <strong>Next Term Begins:</strong>
                <input type="date" value={nextTerm} onChange={e => setNextTerm(e.target.value)}
                  style={{ ...inputStyle('auto'), ...EDITABLE_BG, fontSize:'10px' }} />
              </div>
            </div>
            <div style={S.ratingBox}>
              <div style={{ fontWeight:'bold', fontSize:'10px', marginBottom:'3px' }}>Rating Indices</div>
              <div>5 - Maintains an Excellent degree of</div>
              <div>&nbsp;&nbsp;&nbsp;Observable (Obs) traits</div>
              <div>4 - Maintains a High level of Obs traits</div>
              <div>3 - Acceptable level of Obs traits</div>
              <div>2 - Shows Minimal regard for Obs traits</div>
              <div>1 - Has No regard for Observable traits</div>
            </div>
          </div>

        </div>{/* end sheet */}

        {/* Bottom save bar */}
        <div style={{ backgroundColor:'#1e293b', padding:'10px 16px', borderRadius:'0 0 8px 8px',
          display:'flex', justifyContent:'flex-end', gap:'10px' }}>
          <Btn onClick={onClose} disabled={loading} bg="rgba(255,255,255,0.12)">Cancel</Btn>
          <Btn onClick={() => handleSave(false)} disabled={loading||fetching} bg="#3b82f6">
            <Save size={15}/>{loading ? 'Saving…':'Save Draft'}
          </Btn>
          <Btn onClick={() => handleSave(true)} disabled={loading||fetching} bg="#16a34a">
            <Send size={15}/>{loading ? 'Submitting…':'Submit to Admin'}
          </Btn>
        </div>

      </div>
    </div>
  );
};

export default VisualResultEntry;