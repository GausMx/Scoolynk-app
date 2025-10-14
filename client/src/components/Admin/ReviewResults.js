import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Printer,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  FileText
} from 'lucide-react';

/**
 * Editable student result sheet UI (printable)
 * - Bootstrap + lucide-react
 * - Mock data (replace fetch/save with API calls later)
 */

const SUBJECTS = [
  'Mathematics',
  'English Language',
  'Yoruba Language',
  'Social Studies',
  'Basic Science',
  'Basic Technology',
  'Computer Science',
  'History',
  'Agricultural Science',
];

const MOCK_STUDENTS = [
  {
    id: 's001',
    name: 'Ngozi Okoro',
    regNo: 'JSS1-0001',
    className: 'JSS 1',
    gender: 'F',
    session: '2024/2025',
    attendance: { opened: 200, present: 185, absent: 15 },
    subjects: SUBJECTS.map((sub) => ({ subject: sub, ca1: 0, ca2: 0, exam: 0 })),
    affective: {
      punctuality: 4,
      behaviour: 3,
      neatness: 4,
      relationship: 4,
    },
    fees: { tuition: 50000, uniform: 1000, books: 233, lesson: 1300, other: 4500 },
    comments: {
      teacher: '',
      principal: '',
    },
  },
  {
    id: 's002',
    name: 'Chinedu Eze',
    regNo: 'SSS3-0012',
    className: 'SSS 3',
    gender: 'M',
    session: '2024/2025',
    attendance: { opened: 200, present: 195, absent: 5 },
    subjects: SUBJECTS.map((sub, i) => ({ subject: sub, ca1: 10, ca2: 10, exam: 50 - (i % 6) })),
    affective: {
      punctuality: 5,
      behaviour: 4,
      neatness: 5,
      relationship: 5,
    },
    fees: { tuition: 65000, uniform: 1000, books: 500, lesson: 1500, other: 500 },
    comments: { teacher: 'Good progress', principal: '' },
  },
  {
    id: 's003',
    name: 'Fatima Bello',
    regNo: 'JSS2-0042',
    className: 'JSS 2',
    gender: 'F',
    session: '2024/2025',
    attendance: { opened: 200, present: 160, absent: 40 },
    subjects: SUBJECTS.map((sub) => ({ subject: sub, ca1: 5, ca2: 5, exam: 20 })),
    affective: { punctuality: 2, behaviour: 2, neatness: 3, relationship: 2 },
    fees: { tuition: 50000, uniform: 1000, books: 233, lesson: 1300, other: 4500 },
    comments: { teacher: 'Needs improvement', principal: '' },
  },
];

const gradeFromPercent = (percent) => {
  if (percent >= 70) return { grade: 'A', remark: 'Excellent' };
  if (percent >= 60) return { grade: 'B', remark: 'Very Good' };
  if (percent >= 50) return { grade: 'C', remark: 'Good' };
  if (percent >= 40) return { grade: 'D', remark: 'Fair' };
  return { grade: 'F', remark: 'Poor' };
};

const PrintableResult = React.forwardRef(({ student }, ref) => {
  // Build printable markup similar to your image (clean, compact)
  const totalPoints = student.subjects.reduce((s, sub) => s + (Number(sub.ca1) + Number(sub.ca2) + Number(sub.exam)), 0);
  const maxTotal = student.subjects.length * 100;
  const percent = Math.round((totalPoints / maxTotal) * 100);
  const { grade, remark } = gradeFromPercent(percent);

  return (
    <div ref={ref} className="p-4" style={{ background: '#fff', color: '#000' }}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h4 className="mb-0">Spotlight Comprehensive College</h4>
          <div className="text-muted small">28, Oviawe Street Off Ayẹpẹ Road, Sagamu, Ogun State</div>
        </div>
        <div className="text-end">
          <div className="border rounded-2 p-2" style={{ width: 96, height: 96 }}>
            {/* Placeholder for photo */}
            <div className="h-100 w-100 d-flex align-items-center justify-content-center bg-light">Photo</div>
          </div>
        </div>
      </div>

      <div className="border rounded-2 p-3 mb-3">
        <div className="row">
          <div className="col-md-6">
            <div><strong>Name:</strong> {student.name}</div>
            <div><strong>Reg No:</strong> {student.regNo}</div>
            <div><strong>Class:</strong> {student.className}</div>
          </div>
          <div className="col-md-6">
            <div><strong>Session:</strong> {student.session}</div>
            <div><strong>Gender:</strong> {student.gender}</div>
            <div><strong>Overall Total:</strong> {totalPoints}</div>
          </div>
        </div>
      </div>

      <table className="table table-bordered mb-3">
        <thead className="table-light">
          <tr>
            <th>Subject</th>
            <th className="text-center">1st C.A</th>
            <th className="text-center">2nd C.A</th>
            <th className="text-center">Exam</th>
            <th className="text-center">Total</th>
            <th className="text-center">Grade</th>
            <th className="text-center">Remark</th>
          </tr>
        </thead>
        <tbody>
          {student.subjects.map((s, idx) => {
            const t = Number(s.ca1) + Number(s.ca2) + Number(s.exam);
            const perc = Math.round((t / 100) * 100) / 1;
            const g = gradeFromPercent(perc);
            return (
              <tr key={idx}>
                <td>{s.subject}</td>
                <td className="text-center">{s.ca1}</td>
                <td className="text-center">{s.ca2}</td>
                <td className="text-center">{s.exam}</td>
                <td className="text-center">{t}</td>
                <td className="text-center">{g.grade}</td>
                <td className="text-center small">{g.remark}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="row mb-3">
        <div className="col-md-6">
          <h6 className="mb-2">Affective Traits</h6>
          <table className="table table-sm table-borderless">
            <tbody>
              {Object.entries(student.affective).map(([k, v]) => (
                <tr key={k}><td className="text-capitalize">{k.replace(/([A-Z])/g, ' $1')}</td><td>{v} / 5</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col-md-6">
          <h6 className="mb-2">School Bills</h6>
          <table className="table table-sm table-borderless">
            <tbody>
              {Object.entries(student.fees).map(([k, v]) => (
                <tr key={k}><td className="text-capitalize">{k}</td><td>₦{v.toLocaleString()}</td></tr>
              ))}
              <tr className="border-top"><td><strong>Total</strong></td>
                <td><strong>₦{Object.values(student.fees).reduce((a,b)=>a+Number(b),0).toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4">
        <strong>Teacher's Comment:</strong>
        <div className="border rounded-1 p-2" style={{ minHeight: 48 }}>{student.comments.teacher || '—'}</div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          <div>Teacher's Signature: _____________________</div>
          <div className="mt-2">Principal's Signature: ____________________</div>
        </div>
        <div className="text-end small text-muted">Generated: {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
});

const StudentResults = () => {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [filterClass, setFilterClass] = useState('all');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [message, setMessage] = useState('');
  const printRef = useRef(null);

  // classes list from students
  const classes = useMemo(() => {
    const s = Array.from(new Set(students.map((st) => st.className)));
    return s.sort();
  }, [students]);

  // grouped and filtered
  const grouped = useMemo(() => {
    const byClass = {};
    students
      .filter((st) => (filterClass === 'all' ? true : st.className === filterClass))
      .filter((st) => (search ? (st.name + st.regNo + st.className).toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a,b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
      .forEach((st) => {
        if (!byClass[st.className]) byClass[st.className] = [];
        byClass[st.className].push(st);
      });
    return byClass;
  }, [students, filterClass, search, sortAsc]);

  // Edit handlers (update subject scores, comments, affective etc.)
  const updateStudent = (studentId, patch) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...patch } : s));
    setMessage('Saved locally. (Replace with API call to persist)');
    setTimeout(()=>setMessage(''), 2500);
  };

  const updateSubject = (studentId, idx, field, value) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const subjects = s.subjects.map((sub, i) => i === idx ? { ...sub, [field]: value } : sub);
      return { ...s, subjects };
    }));
  };

  const saveStudent = (studentId) => {
    const st = students.find(s => s.id === studentId);
    // placeholder: call API to save
    updateStudent(studentId, {}); // this triggers message
  };

  const printStudent = (studentId) => {
    // Render printable content to a new window to avoid CSS bleed
    const student = students.find(s => s.id === studentId);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const markup = document.createElement('div');
    // render simple markup similar to PrintableResult, but we can reuse component by serializing HTML
    // We'll build a small HTML using the same structure (safe for demo)
    const totalPoints = student.subjects.reduce((s, sub) => s + (Number(sub.ca1) + Number(sub.ca2) + Number(sub.exam)), 0);
    const maxTotal = student.subjects.length * 100;
    const percent = Math.round((totalPoints / maxTotal) * 100);
    const g = gradeFromPercent(percent);

    const subjectRows = student.subjects.map(su => {
      const t = Number(su.ca1) + Number(su.ca2) + Number(su.exam);
      const g2 = gradeFromPercent((t / 100) * 100);
      return `<tr>
        <td>${su.subject}</td>
        <td style="text-align:center">${su.ca1}</td>
        <td style="text-align:center">${su.ca2}</td>
        <td style="text-align:center">${su.exam}</td>
        <td style="text-align:center">${t}</td>
        <td style="text-align:center">${g2.grade}</td>
        <td style="text-align:center">${g2.remark}</td>
      </tr>`;
    }).join('');

    const feesRows = Object.entries(student.fees).map(([k,v]) => `<tr><td>${k}</td><td>₦${Number(v).toLocaleString()}</td></tr>`).join('');

    const html = `
      <html>
        <head>
          <title>Result - ${student.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
          <style>body{padding:20px;font-family:Arial,Helvetica,sans-serif} table{width:100%;border-collapse:collapse} table th,table td{border:1px solid #ddd;padding:.35rem}</style>
        </head>
        <body>
          <h3>Spotlight Comprehensive College</h3>
          <div><strong>${student.name}</strong> — Reg: ${student.regNo} — Class: ${student.className}</div>
          <hr/>
          <table>
            <thead>
              <tr>
                <th>Subject</th><th>1st C.A</th><th>2nd C.A</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${subjectRows}
            </tbody>
          </table>
          <div style="margin-top:12px">
            <strong>Overall Total:</strong> ${totalPoints} &nbsp; <strong>Percent:</strong> ${percent}% &nbsp; <strong>Grade:</strong> ${g.grade}
          </div>
          <div style="margin-top:12px">
            <h6>Affective Traits</h6>
            <ul>
              ${Object.entries(student.affective).map(([k,v])=>`<li>${k}: ${v}/5</li>`).join('')}
            </ul>
          </div>
          <div style="margin-top:12px">
            <h6>Fees</h6>
            <table>
              ${feesRows}
              <tr><td><strong>Total</strong></td><td><strong>₦${Object.values(student.fees).reduce((a,b)=>a+Number(b),0).toLocaleString()}</strong></td></tr>
            </table>
          </div>
          <div style="margin-top:20px">Teacher's comment: ${student.comments.teacher || '—'}</div>
          <script>setTimeout(()=>{window.print();},300)</script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const sendAllToParents = () => {
    // placeholder: send all approved results to parents
    setMessage('Sending results to parents... (simulated)');
    setTimeout(()=>setMessage('All results dispatched to parents (simulated).'), 1400);
  };

  return (
    <div className="container py-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h3 className="mb-0 text-primary"><FileText className="me-2" /> Student Results Management</h3>
          <div className="small text-muted">Edit scores, compute totals and grades, print or send results to parents.</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={16} /></span>
            <input className="form-control" placeholder="Search by name, reg no..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>

          <select className="form-select" style={{width:160}} value={filterClass} onChange={(e)=>setFilterClass(e.target.value)}>
            <option value="all">All classes</option>
            {classes.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>

          <button className="btn btn-outline-secondary" onClick={()=>setSortAsc(s=>!s)} title="Toggle sort">
            {sortAsc ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {sortAsc ? 'A→Z' : 'Z→A'}
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="mb-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-muted">No students found.</div>
        ) : (
          Object.entries(grouped).map(([cls, studentsInClass]) => (
            <div key={cls} className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 text-primary">{cls}</h5>
                <div className="small text-muted">{studentsInClass.length} student(s)</div>
              </div>

              <div className="row g-3">
                {studentsInClass.map((st) => {
                  const overallTotal = st.subjects.reduce((s, su)=> s + Number(su.ca1 || 0) + Number(su.ca2 || 0) + Number(su.exam || 0), 0);
                  const percent = Math.round((overallTotal / (st.subjects.length * 100)) * 100);
                  const g = gradeFromPercent(percent);

                  return (
                    <div key={st.id} className="col-12 col-md-6">
                      <div className="card shadow-sm rounded-4">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-0 fw-bold">{st.name}</h6>
                              <div className="small text-muted">{st.regNo} • {st.className}</div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold">{overallTotal}</div>
                              <div className="small text-muted">{percent}% • {g.grade}</div>
                            </div>
                          </div>

                          {/* Subjects editable small table */}
                          <div className="table-responsive mb-2">
                            <table className="table table-sm mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Subject</th>
                                  <th className="text-center">CA1</th>
                                  <th className="text-center">CA2</th>
                                  <th className="text-center">Exam</th>
                                </tr>
                              </thead>
                              <tbody>
                                {st.subjects.map((sub, idx) => (
                                  <tr key={idx}>
                                    <td style={{minWidth:160}} className="small">{sub.subject}</td>
                                    <td className="text-center">
                                      <input value={sub.ca1} onChange={(e)=>updateSubject(st.id, idx, 'ca1', e.target.value)} className="form-control form-control-sm text-center" />
                                    </td>
                                    <td className="text-center">
                                      <input value={sub.ca2} onChange={(e)=>updateSubject(st.id, idx, 'ca2', e.target.value)} className="form-control form-control-sm text-center" />
                                    </td>
                                    <td className="text-center">
                                      <input value={sub.exam} onChange={(e)=>updateSubject(st.id, idx, 'exam', e.target.value)} className="form-control form-control-sm text-center" />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-sm btn-primary" onClick={()=>saveStudent(st.id)}>
                              <Save size={14} className="me-1" /> Save
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={()=>printStudent(st.id)}>
                              <Printer size={14} className="me-1" /> Print Result
                            </button>
                            <button className="btn btn-sm btn-outline-success ms-auto" onClick={()=>{ updateStudent(st.id, { comments: { ...st.comments, teacher: st.comments.teacher || 'Well done' } }); setMessage('Sent to parent (simulated)'); setTimeout(()=>setMessage(''), 1500); }}>
                              <Send size={14} className="me-1" /> Send To Parent
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <button className="btn btn-outline-primary" onClick={sendAllToParents}><Send size={14} className="me-1" /> Send All To Parents</button>
      </div>
    </div>
  );
};

export default StudentResults;
