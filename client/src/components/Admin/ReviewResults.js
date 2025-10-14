import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Printer,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print'; // <-- we’ll use this for printing

// Subjects & mock data
const SUBJECTS = [
  'Mathematics', 'English Language', 'Yoruba Language', 'Social Studies',
  'Basic Science', 'Basic Technology', 'Computer Science', 'History', 'Agricultural Science',
];

const MOCK_STUDENTS = [
  {
    id: 's001', name: 'Ngozi Okoro', regNo: 'JSS1-0001', className: 'JSS 1', gender: 'F', session: '2024/2025',
    attendance: { opened: 200, present: 185, absent: 15 },
    subjects: SUBJECTS.map((sub) => ({ subject: sub, ca1: 0, ca2: 0, exam: 0 })),
    affective: { punctuality: 4, behaviour: 3, neatness: 4, relationship: 4 },
    fees: { tuition: 50000, uniform: 1000, books: 233, lesson: 1300, other: 4500 },
    comments: { teacher: '', principal: '' },
  },
  {
    id: 's002', name: 'Chinedu Eze', regNo: 'SSS3-0012', className: 'SSS 3', gender: 'M', session: '2024/2025',
    attendance: { opened: 200, present: 195, absent: 5 },
    subjects: SUBJECTS.map((sub, i) => ({ subject: sub, ca1: 10, ca2: 10, exam: 50 - (i % 6) })),
    affective: { punctuality: 5, behaviour: 4, neatness: 5, relationship: 5 },
    fees: { tuition: 65000, uniform: 1000, books: 500, lesson: 1500, other: 500 },
    comments: { teacher: 'Good progress', principal: '' },
  },
];

// Grade calculation
const gradeFromPercent = (percent) => {
  if (percent >= 70) return { grade: 'A', remark: 'Excellent' };
  if (percent >= 60) return { grade: 'B', remark: 'Very Good' };
  if (percent >= 50) return { grade: 'C', remark: 'Good' };
  if (percent >= 40) return { grade: 'D', remark: 'Fair' };
  return { grade: 'F', remark: 'Poor' };
};

// Printable component
const PrintableResult = React.forwardRef(({ student }, ref) => {
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

      <div className="table-responsive d-flex justify-content-center mb-3">
        <table className="table table-bordered" style={{ maxWidth: '90%' }}>
          <thead className="table-light">
            <tr>
              <th>Subject</th><th className="text-center">CA1</th><th className="text-center">CA2</th>
              <th className="text-center">Exam</th><th className="text-center">Total</th>
              <th className="text-center">Grade</th><th className="text-center">Remark</th>
            </tr>
          </thead>
          <tbody>
            {student.subjects.map((s, idx) => {
              const t = Number(s.ca1) + Number(s.ca2) + Number(s.exam);
              const g2 = gradeFromPercent((t / 100) * 100);
              return (
                <tr key={idx}>
                  <td>{s.subject}</td>
                  <td className="text-center">{s.ca1}</td>
                  <td className="text-center">{s.ca2}</td>
                  <td className="text-center">{s.exam}</td>
                  <td className="text-center">{t}</td>
                  <td className="text-center">{g2.grade}</td>
                  <td className="text-center">{g2.remark}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div><strong>Teacher's Comment:</strong> {student.comments.teacher || '—'}</div>
    </div>
  );
});

// Main component
const StudentResults = () => {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [filterClass, setFilterClass] = useState('all');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [message, setMessage] = useState('');
  const printRef = useRef(null);
  const [currentStudent, setCurrentStudent] = useState(null);

  const classes = useMemo(() => Array.from(new Set(students.map(st => st.className))).sort(), [students]);

  const grouped = useMemo(() => {
    const byClass = {};
    students
      .filter(st => filterClass === 'all' || st.className === filterClass)
      .filter(st => !search || (st.name + st.regNo + st.className).toLowerCase().includes(search.toLowerCase()))
      .sort((a,b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
      .forEach(st => { if (!byClass[st.className]) byClass[st.className]=[]; byClass[st.className].push(st); });
    return byClass;
  }, [students, filterClass, search, sortAsc]);

  const updateSubject = (studentId, idx, field, value) => {
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      subjects: s.subjects.map((sub, i) => i === idx ? { ...sub, [field]: value } : sub)
    } : s));
  };

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  return (
    <div className="container py-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h3 className="mb-0 text-primary"><FileText className="me-2" /> Student Results</h3>
          <div className="small text-muted">Edit scores, compute totals and grades, print or send results.</div>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {Object.keys(grouped).map(cls => (
        <div key={cls} className="mb-5">
          <h5 className="text-primary">{cls}</h5>
          <div className="row g-3">
            {grouped[cls].map(st => {
              const overallTotal = st.subjects.reduce((s, su) => s + Number(su.ca1 || 0) + Number(su.ca2 || 0) + Number(su.exam || 0), 0);
              const percent = Math.round((overallTotal / (st.subjects.length * 100)) * 100);
              const g = gradeFromPercent(percent);

              return (
                <div key={st.id} className="col-12 col-md-6 d-flex justify-content-center">
                  <div className="card shadow-sm rounded-4 w-100 p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <h6 className="mb-0 fw-bold">{st.name}</h6>
                        <div className="small text-muted">{st.regNo}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{overallTotal}</div>
                        <div className="small text-muted">{percent}% • {g.grade}</div>
                      </div>
                    </div>

                    <div className="table-responsive mb-2">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Subject</th><th className="text-center">CA1</th><th className="text-center">CA2</th><th className="text-center">Exam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {st.subjects.map((sub, idx) => (
                            <tr key={idx}>
                              <td>{sub.subject}</td>
                              <td className="text-center">
                                <input value={sub.ca1} onChange={e => updateSubject(st.id, idx, 'ca1', e.target.value)} className="form-control form-control-sm text-center"/>
                              </td>
                              <td className="text-center">
                                <input value={sub.ca2} onChange={e => updateSubject(st.id, idx, 'ca2', e.target.value)} className="form-control form-control-sm text-center"/>
                              </td>
                              <td className="text-center">
                                <input value={sub.exam} onChange={e => updateSubject(st.id, idx, 'exam', e.target.value)} className="form-control form-control-sm text-center"/>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-sm btn-primary" onClick={()=>setMessage('Saved (simulated)')}><Save size={14} className="me-1"/> Save</button>
                      <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={()=>{setCurrentStudent(st); setTimeout(handlePrint, 200);}}><Printer size={14} className="me-1"/> Print</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Hidden printable component */}
      {currentStudent && <div style={{ display: 'none' }}><PrintableResult ref={printRef} student={currentStudent}/></div>}
    </div>
  );
};

export default StudentResults;
