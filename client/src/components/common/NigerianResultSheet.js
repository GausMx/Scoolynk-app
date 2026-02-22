
import React from 'react';

// ─── Grade Scale (Nigerian WAEC-style) ───────────────────────────────────────
export const getNigerianGrade = (total) => {
  if (total >= 95) return { grade: 'A+', remark: 'EXCEPTIONAL' };
  if (total >= 90) return { grade: 'A',  remark: 'DISTINCTION' };
  if (total >= 85) return { grade: 'A-', remark: 'EXCELLENT' };
  if (total >= 80) return { grade: 'B+', remark: 'VERY GOOD' };
  if (total >= 75) return { grade: 'B',  remark: 'VERY GOOD' };
  if (total >= 70) return { grade: 'B-', remark: 'BELOW STANDARD' };
  if (total >= 60) return { grade: 'C',  remark: 'GOOD' };
  if (total >= 40) return { grade: 'D',  remark: 'AVERAGE' };
  return            { grade: 'F',  remark: 'PASS' };
};

// ─── Affective Rating (5-to-1 scale with checkmarks) ─────────────────────────
const AffectiveMark = ({ value, max = 5 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '1px' }}>
    {Array.from({ length: max }, (_, i) => {
      const col = max - i; // columns are labeled 5,4,3,2,1 left to right
      return (
        <span key={i} style={{
          width: '14px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold'
        }}>
          {col === value ? '✓' : ''}
        </span>
      );
    })}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const NigerianResultSheet = ({
  result,
  school = {},
  student = {},
  classSize = 0,
  nextTermBegins = '',
  termBegins = '',
  termEnds = '',
}) => {
  const subjects = result?.subjects || [];
  const affective = result?.affectiveTraits || {};
  const attendance = result?.attendance || {};
  const comments = result?.comments || {};

  // ── Computed totals ──────────────────────────────────────────────────────
  const totalObtainable = subjects.length * 100;
  const totalObtained = subjects.reduce((s, subj) => s + (subj.total || 0), 0);
  const percentage = totalObtainable > 0
    ? ((totalObtained / totalObtainable) * 100).toFixed(1)
    : '0.0';
  const overallGradeInfo = getNigerianGrade(parseFloat(percentage));

  // ── Psychomotor skills (from affective traits or separate field) ─────────
  const psychomotorSkills = [
    { label: 'Handling Of Tools',   key: 'handlingOfTools' },
    { label: 'Drawing/ Painting',   key: 'drawingPainting' },
    { label: 'Handwriting',          key: 'handwriting' },
    { label: 'Public Speaking',      key: 'publicSpeaking' },
    { label: 'Speech Fluency',       key: 'speechFluency' },
    { label: 'Sports & Games',       key: 'sportsGames' },
  ];

  const affectiveSkills = [
    { label: 'Attentiveness',         key: 'attentiveness' },
    { label: 'Honesty',               key: 'honesty' },
    { label: 'Neatness',              key: 'neatness' },
    { label: 'Politeness',            key: 'politeness' },
    { label: 'Punctuality/ Assembly', key: 'punctuality' },
    { label: 'Self Control/ Calmness',key: 'selfControl' },
    { label: 'Obedience',             key: 'obedience' },
    { label: 'Reliability',           key: 'reliability' },
    { label: 'Sense of Responsibility',key: 'responsibility' },
    { label: 'Relationship With Others',key: 'relationship' },
  ];

  const termLabel = result?.term || 'Third Term';
  const session   = result?.session || '2021/2022';

  // ── CSS (inline for PDF-safe rendering) ──────────────────────────────────
  const styles = {
    page: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '11px',
      color: '#000',
      backgroundColor: '#fff',
      maxWidth: '780px',
      margin: '0 auto',
      padding: '12px 16px',
      border: '2px solid #000',
      boxSizing: 'border-box',
    },
    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      marginBottom: '6px',
      paddingBottom: '6px',
      borderBottom: '2px solid #000',
    },
    logo: {
      width: '72px', height: '72px', objectFit: 'contain',
    },
    logoPlaceholder: {
      width: '72px', height: '72px', border: '1px solid #ccc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '9px', color: '#aaa',
    },
    schoolName: {
      fontSize: '22px', fontWeight: 'bold', textAlign: 'center',
      fontFamily: '"Times New Roman", Times, serif', letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    schoolMotto: {
      fontSize: '11px', fontStyle: 'italic', textAlign: 'center',
    },
    schoolContact: {
      fontSize: '9.5px', textAlign: 'center', color: '#222',
    },
    passport: {
      width: '68px', height: '80px', objectFit: 'cover',
      border: '1px solid #000',
    },
    passportPlaceholder: {
      width: '68px', height: '80px', border: '1px solid #000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '8px', color: '#aaa', textAlign: 'center', flexDirection: 'column',
    },
    // ── Session Banner ───────────────────────────────────────────────────────
    sessionBanner: {
      textAlign: 'center', fontWeight: 'bold', fontSize: '13px',
      border: '1px solid #000', padding: '3px 0', margin: '5px 0',
      backgroundColor: '#f5f5f5', textTransform: 'uppercase',
    },
    // ── Grid helpers ─────────────────────────────────────────────────────────
    row: { display: 'flex', gap: '0' },
    col: { flex: 1 },
    // ── Bio / Attendance / Summary top band ──────────────────────────────────
    topBand: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      border: '1px solid #000',
      marginBottom: '4px',
    },
    topCell: {
      padding: '3px 5px',
      borderRight: '1px solid #000',
    },
    topCellLast: {
      padding: '3px 5px',
    },
    label: { fontWeight: 'bold', fontSize: '10px' },
    value: { fontSize: '10px' },
    bioPair: { display: 'flex', marginBottom: '1px', gap: '4px' },
    // ── Attendance inner grid ────────────────────────────────────────────────
    attGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      textAlign: 'center', marginTop: '2px',
    },
    attCol: { borderRight: '1px solid #ccc', padding: '1px 0' },
    attLabel: { fontSize: '9px', borderBottom: '1px solid #ccc' },
    attValue: { fontSize: '11px', fontWeight: 'bold' },
    // ── Performance Summary ──────────────────────────────────────────────────
    summaryGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
      fontSize: '10px',
    },
    summaryLabel: { fontWeight: 'bold' },
    // ── Scores Table ─────────────────────────────────────────────────────────
    table: {
      width: '100%', borderCollapse: 'collapse', marginBottom: '4px',
      fontSize: '10px',
    },
    th: {
      border: '1px solid #000', padding: '2px 3px', textAlign: 'center',
      backgroundColor: '#e8e8e8', fontWeight: 'bold', fontSize: '9.5px',
    },
    td: {
      border: '1px solid #000', padding: '2px 3px', textAlign: 'center',
    },
    tdLeft: {
      border: '1px solid #000', padding: '2px 5px', textAlign: 'left',
    },
    // ── Bottom two columns ───────────────────────────────────────────────────
    bottomSection: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
      marginBottom: '4px',
    },
    domainBox: {
      border: '1px solid #000',
    },
    domainHeader: {
      backgroundColor: '#e8e8e8', fontWeight: 'bold', textAlign: 'center',
      padding: '2px', fontSize: '10px', borderBottom: '1px solid #000',
    },
    domainScaleHeader: {
      display: 'flex', backgroundColor: '#e8e8e8',
      borderBottom: '1px solid #000', fontSize: '9px',
    },
    domainScaleLabel: {
      flex: 3, padding: '1px 4px', borderRight: '1px solid #000',
    },
    domainScaleCols: {
      flex: 2, display: 'flex',
    },
    domainScaleCol: {
      flex: 1, textAlign: 'center', borderRight: '1px solid #ccc',
      padding: '1px 0', fontWeight: 'bold',
    },
    domainRow: {
      display: 'flex', borderBottom: '1px solid #e0e0e0', fontSize: '9.5px', minHeight: '14px',
    },
    domainRowLabel: {
      flex: 3, padding: '1px 4px', borderRight: '1px solid #000',
    },
    domainRowCols: {
      flex: 2, display: 'flex',
    },
    domainRowCol: {
      flex: 1, textAlign: 'center', borderRight: '1px solid #ccc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '10px', fontWeight: 'bold',
    },
    // ── Grade Scale Box ──────────────────────────────────────────────────────
    gradeBox: {
      border: '1px solid #000', padding: '4px', fontSize: '9.5px',
    },
    gradeHeader: {
      fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000',
      marginBottom: '3px', paddingBottom: '2px', fontSize: '10px',
    },
    gradeRow: {
      display: 'flex', justifyContent: 'space-between', marginBottom: '1px',
    },
    // ── Comments Section ─────────────────────────────────────────────────────
    commentsSection: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
      marginBottom: '4px',
    },
    commentBox: {
      border: '1px solid #000', padding: '4px',
    },
    commentLabel: {
      fontWeight: 'bold', fontSize: '10px', marginBottom: '2px',
    },
    commentText: {
      fontSize: '10px', fontStyle: 'italic', minHeight: '30px',
    },
    sigLine: {
      borderTop: '1px solid #000', marginTop: '8px', paddingTop: '2px',
      fontSize: '9.5px',
    },
    // ── Status / Footer ──────────────────────────────────────────────────────
    statusRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px',
    },
    // ── Rating Index ─────────────────────────────────────────────────────────
    ratingBox: {
      border: '1px solid #000', padding: '4px', fontSize: '9px', marginTop: '4px',
    },
    ratingHeader: {
      fontWeight: 'bold', fontSize: '10px', marginBottom: '3px',
    },
  };

  const DomainSection = ({ title, skills, traits, max = 5 }) => (
    <div style={styles.domainBox}>
      <div style={styles.domainHeader}>{title}</div>
      {/* Column headers: 5 4 3 2 1 */}
      <div style={styles.domainScaleHeader}>
        <div style={styles.domainScaleLabel}>Traits</div>
        <div style={styles.domainScaleCols}>
          {[5,4,3,2,1].map(n => (
            <div key={n} style={styles.domainScaleCol}>{n}</div>
          ))}
        </div>
      </div>
      {skills.map((skill, i) => {
        const val = traits[skill.key] || 0;
        return (
          <div key={i} style={{
            ...styles.domainRow,
            backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
          }}>
            <div style={styles.domainRowLabel}>{skill.label}</div>
            <div style={styles.domainRowCols}>
              {[5,4,3,2,1].map(n => (
                <div key={n} style={styles.domainRowCol}>
                  {val === n ? '✓' : ''}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={styles.page} id="nigerian-result-sheet">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER: Logo | School Info | Passport
      ════════════════════════════════════════════════════════════════════ */}
      <div style={styles.header}>
        {/* Logo */}
        {school.logoBase64 ? (
          <img src={school.logoBase64} alt="School Logo" style={styles.logo} />
        ) : (
          <div style={styles.logoPlaceholder}>LOGO</div>
        )}

        {/* School Details */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={styles.schoolName}>{school.name || 'AL-QALAM ACADEMY KADUNA'}</div>
          {school.motto && (
            <div style={styles.schoolMotto}>Motto: {school.motto}</div>
          )}
          {school.address && (
            <div style={styles.schoolContact}>{school.address}</div>
          )}
          {(school.phone || school.email) && (
            <div style={styles.schoolContact}>
              {school.phone && `Tel: ${school.phone}`}
              {school.phone && school.email && ' | '}
              {school.email && `Email: ${school.email}`}
            </div>
          )}
        </div>

        {/* Student Passport */}
        {student.passportBase64 ? (
          <img src={student.passportBase64} alt="Passport" style={styles.passport} />
        ) : (
          <div style={styles.passportPlaceholder}>
            <span style={{ fontSize: '20px' }}>👤</span>
            <span>Passport Photo</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SESSION BANNER
      ════════════════════════════════════════════════════════════════════ */}
      <div style={styles.sessionBanner}>
        {session} — {termLabel.toUpperCase()} PUPIL'S PERFORMANCE REPORT
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TOP BAND: Personal Data | Attendance | Performance Summary
      ════════════════════════════════════════════════════════════════════ */}
      <div style={styles.topBand}>

        {/* Personal Data */}
        <div style={styles.topCell}>
          <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ccc', marginBottom: '3px', paddingBottom: '2px' }}>
            PERSONAL DATA
          </div>
          <div style={styles.bioPair}>
            <span style={styles.label}>NAME:</span>
            <span style={styles.value}>{student.name || '_______________'}</span>
          </div>
          <div style={styles.bioPair}>
            <span style={styles.label}>ADMIN NO:</span>
            <span style={styles.value}>{student.admNo || student.regNo || '___________'}</span>
          </div>
          <div style={styles.bioPair}>
            <span style={styles.label}>GENDER:</span>
            <span style={styles.value}>{student.gender || '________'}</span>
          </div>
          <div style={styles.bioPair}>
            <span style={styles.label}>CLASS:</span>
            <span style={styles.value}>{student.className || student.classId?.name || '________'}</span>
          </div>
          <div style={styles.bioPair}>
            <span style={styles.label}>D.O.B:</span>
            <span style={styles.value}>{student.dob || '_______________'}</span>
          </div>
          <div style={styles.bioPair}>
            <span style={styles.label}>CLUB/SOCIETY:</span>
            <span style={styles.value}>{student.club || '___________________'}</span>
          </div>
        </div>

        {/* Attendance */}
        <div style={styles.topCell}>
          <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ccc', marginBottom: '3px', paddingBottom: '2px' }}>
            ATTENDANCE
          </div>
          <div style={styles.attGrid}>
            <div style={styles.attCol}>
              <div style={styles.attLabel}>No of Times<br/>School Opened</div>
              <div style={styles.attValue}>{attendance.opened || 0}</div>
            </div>
            <div style={styles.attCol}>
              <div style={styles.attLabel}>No of Times<br/>Present</div>
              <div style={styles.attValue}>{attendance.present || 0}</div>
            </div>
            <div style={{ ...styles.attCol, borderRight: 'none' }}>
              <div style={styles.attLabel}>No of Times<br/>Absent</div>
              <div style={styles.attValue}>{attendance.absent || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: '6px', fontWeight: 'bold', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '3px', fontSize: '10px' }}>
            TERMINAL DURATION
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginTop: '2px' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Term Beginning</div>
              <div>{termBegins || '___________'}</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>Term Ending</div>
              <div>{termEnds || '___________'}</div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div style={styles.topCellLast}>
          <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ccc', marginBottom: '3px', paddingBottom: '2px' }}>
            PERFORMANCE SUMMARY
          </div>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryLabel}>Total Score Obtainable</div>
            <div>{totalObtainable}</div>
            <div style={styles.summaryLabel}>Total Score Obtained</div>
            <div>{totalObtained}</div>
            <div style={styles.summaryLabel}>%TAGE</div>
            <div>{percentage}%</div>
            <div style={styles.summaryLabel}>GRADE</div>
            <div style={{ fontWeight: 'bold' }}>{overallGradeInfo.grade}</div>
            <div style={styles.summaryLabel}>POSITION</div>
            <div style={{ fontWeight: 'bold' }}>
              {result?.overallPosition
                ? `${result.overallPosition}${
                    result.overallPosition === 1 ? 'st' :
                    result.overallPosition === 2 ? 'nd' :
                    result.overallPosition === 3 ? 'rd' : 'th'
                  }`
                : '—'}
            </div>
            <div style={styles.summaryLabel}>CLASS SIZE</div>
            <div>{classSize || '—'}</div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          COGNITIVE DOMAIN — SCORES TABLE
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#d8d8d8', border: '1px solid #000', borderBottom: 'none', padding: '2px', fontSize: '11px' }}>
        COGNITIVE DOMAIN
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '22%', textAlign: 'left' }} rowSpan={2}>SUBJECTS</th>
            {/* Score columns - matches template: CA | EXAM | 3RD TERM | 2ND TERM | 1ST TERM | SESSION AVERAGE | ANNUAL | CLASS POSITION | CLASS AVERAGE | GRADE | REMARKS */}
            <th style={styles.th}>C.A.</th>
            <th style={styles.th}>EXAM</th>
            <th style={styles.th}>3RD TERM</th>
            <th style={styles.th}>2ND TERM</th>
            <th style={styles.th}>1ST TERM</th>
            <th style={styles.th}>SESSION AVERAGE</th>
            <th style={styles.th}>ANNUAL</th>
            <th style={styles.th}>CLASS POSIT.</th>
            <th style={styles.th}>CLASS AVG</th>
            <th style={styles.th}>GRADE</th>
            <th style={styles.th}>REMARKS</th>
          </tr>
          <tr>
            <th style={styles.th}>40</th>
            <th style={styles.th}>60</th>
            <th style={styles.th}>100</th>
            <th style={styles.th}>100</th>
            <th style={styles.th}>100</th>
            <th style={styles.th}>100</th>
            <th style={styles.th}></th>
            <th style={styles.th}></th>
            <th style={styles.th}></th>
            <th style={styles.th}></th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {subjects.length > 0 ? subjects.map((subj, idx) => {
            const g = getNigerianGrade(subj.total || 0);
            return (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ ...styles.tdLeft, fontWeight: idx < 3 ? 'normal' : 'normal', textTransform: 'uppercase', fontSize: '9.5px' }}>
                  {subj.subject}
                </td>
                <td style={styles.td}>{subj.ca || subj.ca1 || ''}</td>
                <td style={styles.td}>{subj.exam || ''}</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{subj.total || ''}</td>
                {/* 2nd term, 1st term - from historical data if available */}
                <td style={styles.td}>{subj.term2Total || ''}</td>
                <td style={styles.td}>{subj.term1Total || ''}</td>
                <td style={styles.td}>{subj.sessionAverage || ''}</td>
                <td style={styles.td}>{subj.annual || ''}</td>
                <td style={styles.td}>{subj.classPosition || ''}</td>
                <td style={styles.td}>{subj.classAverage || ''}</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{g.grade}</td>
                <td style={{ ...styles.td, fontSize: '9px' }}>{g.remark}</td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={12} style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '8px' }}>
                No subjects recorded
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM SECTION: Affective Domain | Psychomotor | Grade Scale
      ════════════════════════════════════════════════════════════════════ */}
      <div style={styles.bottomSection}>

        {/* Left: Affective Domain */}
        <DomainSection
          title="AFFECTIVE DOMAIN"
          skills={affectiveSkills}
          traits={affective}
        />

        {/* Right: Psychomotor + Grade Scale */}
        <div>
          <DomainSection
            title="PSYCHOMOTOR - SKILL"
            skills={psychomotorSkills}
            traits={affective}
          />

          {/* Grade Scale */}
          <div style={{ ...styles.gradeBox, marginTop: '4px' }}>
            <div style={styles.gradeHeader}>Grade Scale</div>
            {[
              { grade: 'A+', range: '95-100%', desc: 'EXCEPTIONAL' },
              { grade: 'A',  range: '90-94.9%', desc: 'DISTINCTION' },
              { grade: 'A-', range: '85-89.9%', desc: 'EXCELLENT' },
              { grade: 'B+', range: '80-84.9%', desc: 'VERY GOOD' },
              { grade: 'B',  range: '75-79.9%', desc: 'BELOW STANDARD' },
              { grade: 'C',  range: '60-74.9%', desc: 'GOOD' },
              { grade: 'D',  range: '40-59.9%', desc: 'AVERAGE' },
              { grade: 'F',  range: '0-39.9%',  desc: 'PASS' },
            ].map((g, i) => (
              <div key={i} style={{ ...styles.gradeRow, backgroundColor: i % 2 === 0 ? '#fff' : '#f5f5f5', padding: '1px 0' }}>
                <span style={{ fontWeight: 'bold', width: '22px', display: 'inline-block' }}>{g.grade}</span>
                <span style={{ width: '70px', display: 'inline-block' }}>{g.range}</span>
                <span>{g.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          COMMENTS SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <div style={styles.commentsSection}>
        {/* Class Teacher's Remark */}
        <div style={styles.commentBox}>
          <div style={styles.commentLabel}>Class Teacher's Remark</div>
          <div style={styles.commentText}>{comments.teacher || '___________________________________'}</div>
          <div style={{ ...styles.sigLine }}>
            <div>Name: {result?.teacher?.name || '___________________________'}</div>
            <div style={{ marginTop: '4px' }}>Name/Sign: ___________________________</div>
          </div>
        </div>

        {/* Head Teacher's Remark */}
        <div style={styles.commentBox}>
          <div style={styles.commentLabel}>Head Teacher's Remark</div>
          <div style={styles.commentText}>{comments.principal || '___________________________________'}</div>
          <div style={{ ...styles.sigLine }}>
            <div>Name: ___________________________</div>
            <div style={{ marginTop: '4px' }}>Name/Sign: ___________________________</div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATUS & NEXT TERM
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #000', paddingTop: '5px', marginTop: '4px' }}>
        <div>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            <strong>Status:</strong>&nbsp;
            <span style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '12px' }}>
              {result?.overallAverage >= 40 ? 'PROMOTED' : 'REPEATED'}
            </span>
          </div>
          <div style={{ fontSize: '10px' }}>
            <strong>Next Session Begins:</strong> {nextTermBegins || '_______________'}
          </div>
        </div>

        {/* Rating Index (bottom right) */}
        <div style={styles.ratingBox}>
          <div style={styles.ratingHeader}>Rating Indices</div>
          <div>5 - Maintains an Excellent degree of</div>
          <div>&nbsp;&nbsp;&nbsp;Observable (Obs) traits</div>
          <div>4 - Maintains a High level of Obs traits</div>
          <div>3 - Acceptable level of Obs traits</div>
          <div>2 - Shows Minimal regard for Obs traits</div>
          <div>1 - Has No regard for Observable traits</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PRINT STYLES (injected when used in browser)
      ════════════════════════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          #nigerian-result-sheet {
            max-width: 100% !important;
            border: 2px solid #000 !important;
            page-break-inside: avoid;
          }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>
    </div>
  );
};

export default NigerianResultSheet;