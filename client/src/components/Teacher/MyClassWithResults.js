// src/components/Teacher/MyClassWithResults.js
// Class teacher view: students, result entry, history.
// ResultsTab now shows subject score completion per student
// (how many subjects have been filled by subject teachers).

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Search, Download, FileText, History,
  Edit, Trash2, Send, Eye, Scan, CheckCircle, Clock
} from 'lucide-react';
import VisualResultEntry from './VisualResultEntry';
import ResultPreviewModal from './ResultPreviewModal';
const { REACT_APP_API_URL } = process.env;

const MyClassWithResults = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [classTeacherFor, setClassTeacherFor] = useState([]);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'results') {
      fetchResults('draft');
    } else if (activeTab === 'history') {
      fetchResults();
    }
  }, [activeTab, selectedTerm, selectedSession]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/my-class/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
      const uniqueClasses = [...new Set(res.data.students?.map(s => s.classId))].filter(Boolean);
      setClassTeacherFor(uniqueClasses);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setMessage('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (status = null) => {
    try {
      setLoading(true);
      const params = { term: selectedTerm, session: selectedSession };
      if (status) params.status = status;
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/results`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setMessage('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-3 py-md-4">
      <div className="row mb-3 mb-md-4">
        <div className="col-12">
          <h2 className="mb-2 mb-md-3 fs-4 fs-md-3">
            <Users className="me-2" size={28} />
            My Class Management
          </h2>
          <p className="text-muted small">
            Class teacher for: {classTeacherFor.map(c => c.name).join(', ') || 'No classes assigned'}
          </p>
        </div>
      </div>

      <ul className="nav nav-pills mb-3 mb-md-4 gap-2 flex-column flex-md-row">
        {[
          { key: 'students', icon: <Users size={18} />, label: 'Students' },
          { key: 'results',  icon: <FileText size={18} />, label: 'Results' },
          { key: 'history',  icon: <History size={18} />, label: 'History' },
        ].map(tab => (
          <li key={tab.key} className="nav-item w-100 w-md-auto">
            <button
              className={`nav-link w-100 d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}<span className="small">{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {message && (
        <div className="alert alert-info alert-dismissible fade show">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} />
        </div>
      )}

      {activeTab === 'students' && (
        <StudentsTab students={filteredStudents} searchTerm={searchTerm} setSearchTerm={setSearchTerm} loading={loading} />
      )}
      {activeTab === 'results' && (
        <ResultsTab
          students={students}
          results={results}
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
          loading={loading}
          refreshResults={() => fetchResults('draft')}
          token={token}
          setMessage={setMessage}
        />
      )}
      {activeTab === 'history' && (
        <HistoryTab
          results={results}
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
          loading={loading}
          token={token}
        />
      )}
    </div>
  );
};

// ── TAB 1: STUDENTS ───────────────────────────────────────────────────────────
const StudentsTab = ({ students, searchTerm, setSearchTerm, loading }) => {
  const studentsByClass = students.reduce((acc, student) => {
    const className = student.classId?.name || 'Unknown';
    const classId   = student.classId?._id  || 'unknown';
    if (!acc[classId]) acc[classId] = { name: className, students: [] };
    acc[classId].students.push(student);
    return acc;
  }, {});

  const exportToCSV = (className, studentsData) => {
    const csvContent = [
      ['#', 'Name', 'Registration Number'],
      ...studentsData.map((s, i) => [i + 1, s.name, s.regNo])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${className}_students.csv`; a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <>
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light"><Search size={20} /></span>
            <input
              type="text" className="form-control"
              placeholder="Search by name or registration number..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {Object.keys(studentsByClass).map(classId => {
        const { name, students: classStudents } = studentsByClass[classId];
        return (
          <div key={classId} className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0 text-primary">{name}</h4>
                <button className="btn btn-sm btn-outline-primary" onClick={() => exportToCSV(name, classStudents)}>
                  <Download size={16} className="me-1" />Export CSV
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr><th>#</th><th>Name</th><th>Registration Number</th></tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, index) => (
                      <tr key={student._id}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{student.name}</td>
                        <td>{student.regNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <small className="text-muted">Total Students: {classStudents.length}</small>
            </div>
          </div>
        );
      })}

      {students.length === 0 && (
        <div className="alert alert-warning">
          <p className="mb-2">No students found in your class.</p>
          <small>Students will appear here after you add them.</small>
        </div>
      )}
    </>
  );
};

// ── TAB 2: RESULTS ────────────────────────────────────────────────────────────
const ResultsTab = ({
  students, results, selectedTerm, setSelectedTerm,
  selectedSession, setSelectedSession, loading, refreshResults, token, setMessage
}) => {
  const [showModal,       setShowModal]       = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingResult,   setEditingResult]   = useState(null);
  const [template,        setTemplate]        = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // ── Subject score completion per class ─────────────────────────────────────
  const [completion,        setCompletion]        = useState([]);   // [{ subject, studentsScored, totalStudents, complete }]
  const [loadingCompletion, setLoadingCompletion] = useState(false);

  // Derive the classId from the first student (all students in this tab share one class)
  const classId = students[0]?.classId?._id || students[0]?.classId;

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoadingTemplate(true);
      try {
        const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/results/template`, {
          headers: { Authorization: `Bearer ${token}` },
          params:  { term: selectedTerm, session: selectedSession }
        });
        setTemplate(res.data?.template || null);
      } catch { setTemplate(null); }
      finally  { setLoadingTemplate(false); }
    };
    fetchTemplate();
  }, [selectedTerm, selectedSession, token]);

  useEffect(() => {
    if (!classId) return;
    setLoadingCompletion(true);
    axios.get(`${REACT_APP_API_URL}/api/teacher/subject-scores/completion`, {
      headers: { Authorization: `Bearer ${token}` },
      params:  { classId, term: selectedTerm, session: selectedSession }
    })
    .then(res => setCompletion(res.data.completion || []))
    .catch(() => setCompletion([]))
    .finally(() => setLoadingCompletion(false));
  }, [classId, selectedTerm, selectedSession, token]);

  const openEntry = (student) => {
    setSelectedStudent(student);
    setEditingResult(results.find(r => r.student._id === student._id) || null);
    setShowModal(true);
  };

  if (loading || loadingTemplate) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <>
      {/* Filters */}
      <div className="row g-2 g-md-3 mb-3 mb-md-4">
        <div className="col-6 col-md-3">
          <select className="form-select form-select-sm" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <input type="text" className="form-control form-control-sm" placeholder="Session"
            value={selectedSession} onChange={e => setSelectedSession(e.target.value)} />
        </div>
      </div>

      {/* ── Subject score completion panel ─────────────────────────────────── */}
      {(completion.length > 0 || loadingCompletion) && (
        <div className="card shadow-sm mb-4">
          <div className="card-body pb-2">
            <h6 className="text-muted mb-3" style={{ fontSize:12, textTransform:'uppercase', letterSpacing:.5 }}>
              Subject Score Completion ({selectedTerm}, {selectedSession})
            </h6>
            {loadingCompletion ? (
              <div className="text-center py-2"><div className="spinner-border spinner-border-sm" /></div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {completion.map(c => (
                  <div
                    key={c.subject}
                    title={`${c.studentsScored}/${c.totalStudents} students scored`}
                    style={{
                      background: c.complete ? '#f0fdf4' : '#fffbeb',
                      border: `1px solid ${c.complete ? '#bbf7d0' : '#fde68a'}`,
                      borderRadius: 8, padding: '6px 12px', fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {c.complete
                      ? <CheckCircle size={14} color="#16a34a" />
                      : <Clock size={14} color="#d97706" />
                    }
                    <span style={{ fontWeight: 600 }}>{c.subject}</span>
                    <span style={{ color: '#64748b' }}>{c.studentsScored}/{c.totalStudents}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Student cards ───────────────────────────────────────────────────── */}
      <div className="row g-2 g-md-3">
        {students.map(student => {
          const existingResult = results.find(r => r.student._id === student._id);
          return (
            <div key={student._id} className="col-12 col-md-6">
              <div className="card shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-0 fw-bold small">{student.name}</h6>
                      <small className="text-muted">{student.regNo} • {student.classId?.name}</small>
                    </div>
                    {existingResult && (
                      <span className={`badge bg-${
                        existingResult.status === 'draft'     ? 'secondary' :
                        existingResult.status === 'submitted' ? 'primary'   :
                        existingResult.status === 'approved'  ? 'success'   :
                        existingResult.status === 'rejected'  ? 'danger'    : 'info'
                      }`}>
                        {existingResult.status}
                      </span>
                    )}
                  </div>

                  {existingResult && (
                    <div className="mb-2">
                      <small className="text-muted">
                        Overall: {existingResult.overallTotal} ({existingResult.overallAverage}%) — {existingResult.overallGrade}
                      </small>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-primary flex-fill" onClick={() => openEntry(student)}>
                      <Edit size={14} className="me-1" />
                      <span className="small">{existingResult ? 'Edit' : 'Enter'} Result</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="alert alert-warning">No students found. Add students first before entering results.</div>
      )}

      {showModal && (
        <VisualResultEntry
          student={selectedStudent}
          existingResult={editingResult}
          term={selectedTerm}
          session={selectedSession}
          template={template}
          onClose={() => { setShowModal(false); setSelectedStudent(null); setEditingResult(null); }}
          onSuccess={() => { setShowModal(false); refreshResults(); setMessage('Result saved successfully!'); }}
          token={token}
        />
      )}
    </>
  );
};

// ── TAB 3: HISTORY ────────────────────────────────────────────────────────────
const HistoryTab = ({ results, selectedTerm, setSelectedTerm, selectedSession, setSelectedSession, loading, token }) => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [showPreview,    setShowPreview]    = useState(false);

  const submitResult = async (resultId) => {
    try {
      await axios.put(`${REACT_APP_API_URL}/api/teacher/results/${resultId}/submit`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      alert('Result submitted to admin successfully!');
      window.location.reload();
    } catch (err) {
      alert('Failed to submit: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteResult = async (resultId) => {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/teacher/results/${resultId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      alert('Result deleted.');
      window.location.reload();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const statusColour = s =>
    s === 'draft' ? 'secondary' : s === 'submitted' ? 'primary' :
    s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'info';

  const gradeColour = g =>
    g === 'A' ? 'success' : g === 'B' ? 'primary' : g === 'C' ? 'info' : g === 'D' ? 'warning' : 'danger';

  return (
    <>
      <div className="row g-2 g-md-3 mb-3 mb-md-4">
        <div className="col-6 col-md-3">
          <select className="form-select form-select-sm" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
            <option value="">All Terms</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <input type="text" className="form-control form-control-sm" placeholder="Session"
            value={selectedSession} onChange={e => setSelectedSession(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : (
        <>
          {/* Mobile */}
          <div className="d-md-none">
            {results.length === 0
              ? <div className="alert alert-info">No results found for the selected criteria.</div>
              : (
                <div className="row g-2">
                  {results.map(result => (
                    <div key={result._id} className="col-12">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 fw-bold small">{result.student.name}</h6>
                              <small className="text-muted d-block">{result.student.regNo}</small>
                            </div>
                            <span className={`badge bg-${statusColour(result.status)}`}>{result.status}</span>
                          </div>
                          <div className="row g-2 mb-2">
                            <div className="col-6"><small className="text-muted d-block">Class</small><span className="badge bg-info text-dark">{result.classId.name}</span></div>
                            <div className="col-6"><small className="text-muted d-block">Term</small><span className="small">{result.term}</span></div>
                            <div className="col-6"><small className="text-muted d-block">Overall</small><span className="small fw-bold">{result.overallTotal}</span></div>
                            <div className="col-6"><small className="text-muted d-block">Grade</small><span className={`badge bg-${gradeColour(result.overallGrade)}`}>{result.overallGrade}</span></div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => { setSelectedResult(result); setShowPreview(true); }}>
                              <Eye size={14} className="me-1" /><span className="small">Preview</span>
                            </button>
                            {result.status === 'draft' && (
                              <>
                                <button className="btn btn-sm btn-outline-success flex-fill" onClick={() => submitResult(result._id)}>
                                  <Send size={14} className="me-1" /><span className="small">Submit</span>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteResult(result._id)}>
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Desktop */}
          <div className="d-none d-md-block table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr><th>Student</th><th>Class</th><th>Term</th><th>Session</th><th>Overall</th><th>Grade</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result._id}>
                    <td>
                      <div className="fw-semibold">{result.student.name}</div>
                      <small className="text-muted">{result.student.regNo}</small>
                    </td>
                    <td>{result.classId.name}</td>
                    <td>{result.term}</td>
                    <td>{result.session}</td>
                    <td>{result.overallTotal}</td>
                    <td><span className={`badge bg-${gradeColour(result.overallGrade)}`}>{result.overallGrade}</span></td>
                    <td><span className={`badge bg-${statusColour(result.status)}`}>{result.status}</span></td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={() => { setSelectedResult(result); setShowPreview(true); }} title="Preview"><Eye size={14} /></button>
                        {result.status === 'draft' && (
                          <>
                            <button className="btn btn-outline-success" onClick={() => submitResult(result._id)} title="Submit"><Send size={14} /></button>
                            <button className="btn btn-outline-danger"  onClick={() => deleteResult(result._id)}  title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && <div className="alert alert-info">No results found for the selected criteria.</div>}
          </div>
        </>
      )}

      {showPreview && selectedResult && (
        <ResultPreviewModal
          result={selectedResult}
          onClose={() => { setShowPreview(false); setSelectedResult(null); }}
          token={token}
        />
      )}
    </>
  );
};

export default MyClassWithResults;