// src/components/Teacher/MyClassWithResults.js - 3 TAB SYSTEM

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Search, Download, FileText, History, 
  Plus, Edit, Trash2, Send, Eye, Upload, Scan
} from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const MyClassWithResults = () => {
  const [activeTab, setActiveTab] = useState('students'); // students, results, history
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [classTeacherFor, setClassTeacherFor] = useState([]);

  const token = localStorage.getItem('token');

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
      const params = {
        term: selectedTerm,
        session: selectedSession
      };
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

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            <Users className="me-2" size={32} />
            My Class Management
          </h2>
          <p className="text-muted">
            You are class teacher for: {classTeacherFor.map(c => c.name).join(', ') || 'No classes assigned'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={18} className="me-2" />
            My Class Students
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <FileText size={18} className="me-2" />
            My Students Results
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} className="me-2" />
            Results History
          </button>
        </li>
      </ul>

      {message && (
        <div className="alert alert-info alert-dismissible fade show">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'students' && (
        <StudentsTab 
          students={filteredStudents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
        />
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

// ==================== TAB 1: STUDENTS ====================
const StudentsTab = ({ students, searchTerm, setSearchTerm, loading }) => {
  const studentsByClass = students.reduce((acc, student) => {
    const className = student.classId?.name || 'Unknown';
    const classId = student.classId?._id || 'unknown';
    if (!acc[classId]) {
      acc[classId] = { name: className, students: [] };
    }
    acc[classId].students.push(student);
    return acc;
  }, {});

  const exportToCSV = (className, studentsData) => {
    const csvContent = [
      ['#', 'Name', 'Registration Number'],
      ...studentsData.map((s, i) => [i + 1, s.name, s.regNo])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}_students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  }

  return (
    <>
      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light">
              <Search size={20} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Students List by Class */}
      {Object.keys(studentsByClass).map((classId) => {
        const classData = studentsByClass[classId];
        return (
          <div key={classId} className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0 text-primary">{classData.name}</h4>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => exportToCSV(classData.name, classData.students)}
                >
                  <Download size={16} className="me-1" />
                  Export CSV
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Registration Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classData.students.map((student, index) => (
                      <tr key={student._id}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{student.name}</td>
                        <td>{student.regNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  Total Students: {classData.students.length}
                </small>
              </div>
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

// ==================== TAB 2: RESULTS ====================
const ResultsTab = ({ 
  students, 
  results, 
  selectedTerm, 
  setSelectedTerm, 
  selectedSession, 
  setSelectedSession,
  loading,
  refreshResults,
  token,
  setMessage 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('manual'); // 'manual' or 'scan'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingResult, setEditingResult] = useState(null);

  const openManualEntry = (student) => {
    setSelectedStudent(student);
    setModalMode('manual');
    setShowModal(true);
    
    // Check if result already exists
    const existing = results.find(r => r.student._id === student._id);
    setEditingResult(existing || null);
  };

  const openOCRScan = (student) => {
    setSelectedStudent(student);
    setModalMode('scan');
    setShowModal(true);
  };

  return (
    <>
      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <select 
            className="form-select" 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-md-3">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Session (e.g., 2024/2025)"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <>
          {/* Students with Result Entry Options */}
          <div className="row g-3">
            {students.map(student => {
              const existingResult = results.find(r => r.student._id === student._id);
              
              return (
                <div key={student._id} className="col-md-6">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-0 fw-bold">{student.name}</h6>
                          <small className="text-muted">{student.regNo} • {student.classId?.name}</small>
                        </div>
                        {existingResult && (
                          <span className={`badge bg-${
                            existingResult.status === 'draft' ? 'secondary' :
                            existingResult.status === 'submitted' ? 'primary' :
                            existingResult.status === 'approved' ? 'success' :
                            existingResult.status === 'rejected' ? 'danger' : 'info'
                          }`}>
                            {existingResult.status}
                          </span>
                        )}
                      </div>
                      
                      {existingResult && (
                        <div className="mb-2">
                          <small className="text-muted">
                            Overall: {existingResult.overallTotal} ({existingResult.overallAverage}%) - {existingResult.overallGrade}
                          </small>
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => openManualEntry(student)}
                        >
                          <Edit size={14} className="me-1" />
                          {existingResult ? 'Edit Scores' : 'Enter Scores'}
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openOCRScan(student)}
                        >
                          <Scan size={14} className="me-1" />
                          Scan Scores
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {students.length === 0 && (
            <div className="alert alert-warning">
              No students found. Add students first before entering results.
            </div>
          )}
        </>
      )}

      {/* Result Entry/Edit Modal */}
      {showModal && (
        <ResultModal 
          mode={modalMode}
          student={selectedStudent}
          existingResult={editingResult}
          term={selectedTerm}
          session={selectedSession}
          onClose={() => {
            setShowModal(false);
            setSelectedStudent(null);
            setEditingResult(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            refreshResults();
            setMessage('Result saved successfully!');
          }}
          token={token}
        />
      )}
    </>
  );
};

// ==================== TAB 3: HISTORY ====================
const HistoryTab = ({ 
  results, 
  selectedTerm, 
  setSelectedTerm, 
  selectedSession, 
  setSelectedSession,
  loading,
  token 
}) => {
  const [selectedResult, setSelectedResult] = useState(null);

  const submitResult = async (resultId) => {
    try {
      await axios.put(
        `${REACT_APP_API_URL}/api/teacher/results/${resultId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Result submitted to admin successfully!');
      window.location.reload();
    } catch (err) {
      alert('Failed to submit result: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteResult = async (resultId) => {
    if (!confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `${REACT_APP_API_URL}/api/teacher/results/${resultId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Result deleted successfully!');
      window.location.reload();
    } catch (err) {
      alert('Failed to delete result: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <select 
            className="form-select" 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="">All Terms</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-md-3">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Session"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Term</th>
                  <th>Session</th>
                  <th>Overall</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
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
                    <td>
                      <span className={`badge bg-${
                        result.overallGrade === 'A' ? 'success' :
                        result.overallGrade === 'B' ? 'primary' :
                        result.overallGrade === 'C' ? 'info' :
                        result.overallGrade === 'D' ? 'warning' : 'danger'
                      }`}>
                        {result.overallGrade}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${
                        result.status === 'draft' ? 'secondary' :
                        result.status === 'submitted' ? 'primary' :
                        result.status === 'approved' ? 'success' :
                        result.status === 'rejected' ? 'danger' : 'info'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye size={14} />
                        </button>
                        {result.status === 'draft' && (
                          <>
                            <button 
                              className="btn btn-outline-success"
                              onClick={() => submitResult(result._id)}
                            >
                              <Send size={14} />
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => deleteResult(result._id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.length === 0 && (
            <div className="alert alert-info">
              No results found for the selected criteria.
            </div>
          )}
        </>
      )}

      {/* View Result Modal */}
      {selectedResult && (
        <ViewResultModal 
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </>
  );
};

// Placeholder components - Will be created in next artifacts
const ResultModal = ({ mode, student, existingResult, term, session, onClose, onSuccess, token }) => {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === 'manual' ? 'Enter/Edit Scores' : 'Scan Scores'} - {student.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {mode === 'manual' ? (
              <p>Manual score entry form will be here...</p>
            ) : (
              <p>OCR scanning interface will be here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewResultModal = ({ result, onClose }) => {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Result Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Full result details will be shown here...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClassWithResults;