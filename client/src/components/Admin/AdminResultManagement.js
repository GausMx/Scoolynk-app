// src/components/Admin/AdminResultManagement.js - COMPLETE ADMIN RESULT SYSTEM

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Upload, Eye, Check, X, Send, Filter,
  Download, AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const AdminResultManagement = () => {
  const [activeTab, setActiveTab] = useState('templates'); // templates, pending, all
  const [templates, setTemplates] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'pending') {
      fetchPendingResults();
    } else if (activeTab === 'all') {
      fetchAllResults();
    }
  }, [activeTab, selectedTerm, selectedSession]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/results/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setMessage('Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/admin/results/submitted`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term: selectedTerm, session: selectedSession }
        }
      );
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch pending results:', err);
      setMessage('Failed to load pending results.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/admin/results`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term: selectedTerm, session: selectedSession }
        }
      );
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setMessage('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h4 className="fw-bold text-primary d-flex align-items-center mb-2">
              <FileText size={28} className="me-2" /> Result Management
            </h4>
            <p className="text-muted mb-0">Manage result templates and review student results</p>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} alert-dismissible`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <Upload size={18} className="me-2" />
              Result Templates
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={18} className="me-2" />
              Pending Review
              {results.filter(r => r.status === 'submitted').length > 0 && (
                <span className="badge bg-danger ms-2">
                  {results.filter(r => r.status === 'submitted').length}
                </span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <FileText size={18} className="me-2" />
              All Results
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'templates' && (
          <TemplatesTab 
            templates={templates}
            loading={loading}
            token={token}
            onSuccess={() => {
              setMessage('Template uploaded successfully!');
              fetchTemplates();
            }}
          />
        )}

        {activeTab === 'pending' && (
          <PendingResultsTab 
            results={results}
            loading={loading}
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            token={token}
            onReviewSuccess={() => {
              setMessage('Result reviewed successfully!');
              fetchPendingResults();
            }}
          />
        )}

        {activeTab === 'all' && (
          <AllResultsTab 
            results={results}
            loading={loading}
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            token={token}
          />
        )}
      </div>
    </div>
  );
};

// ==================== TEMPLATES TAB ====================
const TemplatesTab = ({ templates, loading, token, onSuccess }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Result Templates</h5>
        <button 
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload size={18} className="me-2" />
          Upload New Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <>
          {templates.length === 0 ? (
            <div className="alert alert-info">
              <AlertCircle size={20} className="me-2" />
              No templates uploaded yet. Upload a result template to get started.
            </div>
          ) : (
            <div className="row g-3">
              {templates.map(template => (
                <div key={template._id} className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{template.name}</h6>
                          <small className="text-muted">
                            {template.term} - {template.session}
                          </small>
                        </div>
                        <span className={`badge bg-${template.isActive ? 'success' : 'secondary'}`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {template.templateImage && (
                        <div className="border rounded p-2 mb-2">
                          <img 
                            src={template.templateImage} 
                            alt="Template preview" 
                            className="img-fluid"
                            style={{ maxHeight: '200px', width: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      
                      <div className="text-muted small">
                        <div>Created by: {template.createdBy?.name || 'N/A'}</div>
                        <div>Date: {new Date(template.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showUploadModal && (
        <UploadTemplateModal 
          token={token}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
};

// ==================== PENDING RESULTS TAB ====================
const PendingResultsTab = ({ 
  results, 
  loading, 
  selectedTerm, 
  setSelectedTerm, 
  selectedSession, 
  setSelectedSession,
  token,
  onReviewSuccess 
}) => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const pendingResults = results.filter(r => r.status === 'submitted');

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
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <>
          {pendingResults.length === 0 ? (
            <div className="alert alert-info">
              <CheckCircle size={20} className="me-2" />
              No pending results to review.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Overall</th>
                    <th>Grade</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingResults.map(result => (
                    <tr key={result._id}>
                      <td>
                        <div className="fw-semibold">{result.student.name}</div>
                        <small className="text-muted">{result.student.regNo}</small>
                      </td>
                      <td>{result.classId.name}</td>
                      <td>{result.teacher.name}</td>
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
                        <small>{new Date(result.submittedAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedResult(result);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye size={14} className="me-1" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showReviewModal && selectedResult && (
        <ReviewResultModal 
          result={selectedResult}
          token={token}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedResult(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelectedResult(null);
            onReviewSuccess();
          }}
        />
      )}
    </>
  );
};

// ==================== ALL RESULTS TAB ====================
const AllResultsTab = ({ 
  results, 
  loading, 
  selectedTerm, 
  setSelectedTerm, 
  selectedSession, 
  setSelectedSession,
  token 
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResults, setSelectedResults] = useState([]);

  const filteredResults = results.filter(r => 
    statusFilter === 'all' || r.status === statusFilter
  );

  const approvedResults = filteredResults.filter(r => r.status === 'approved');

  const sendMultipleResults = async () => {
    if (selectedResults.length === 0) {
      alert('Please select results to send');
      return;
    }

    if (!confirm(`Send ${selectedResults.length} result(s) to parents via SMS?`)) {
      return;
    }

    try {
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/admin/results/send-multiple`,
        { resultIds: selectedResults },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setSelectedResults([]);
      window.location.reload();
    } catch (err) {
      alert('Failed to send results: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-2">
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
        <div className="col-md-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Session"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sent">Sent</option>
          </select>
        </div>
        <div className="col-md-6 text-end">
          {selectedResults.length > 0 && (
            <button 
              className="btn btn-success"
              onClick={sendMultipleResults}
            >
              <Send size={18} className="me-2" />
              Send {selectedResults.length} to Parents
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>
                  <input 
                    type="checkbox"
                    checked={selectedResults.length === approvedResults.length && approvedResults.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedResults(approvedResults.map(r => r._id));
                      } else {
                        setSelectedResults([]);
                      }
                    }}
                  />
                </th>
                <th>Student</th>
                <th>Class</th>
                <th>Term</th>
                <th>Session</th>
                <th>Overall</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(result => (
                <tr key={result._id}>
                  <td>
                    {result.status === 'approved' && (
                      <input 
                        type="checkbox"
                        checked={selectedResults.includes(result._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResults([...selectedResults, result._id]);
                          } else {
                            setSelectedResults(selectedResults.filter(id => id !== result._id));
                          }
                        }}
                      />
                    )}
                  </td>
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
                    <small>{result.teacher.name}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// Modals placeholders - these will be detailed in next artifacts
const UploadTemplateModal = ({ token, onClose, onSuccess }) => {
  const [templateImage, setTemplateImage] = useState(null);
  const [name, setName] = useState('');
  const [term, setTerm] = useState('First Term');
  const [session, setSession] = useState('2024/2025');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTemplateImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!templateImage) {
      alert('Please select a template image');
      return;
    }

    try {
      setUploading(true);
      await axios.post(
        `${REACT_APP_API_URL}/api/admin/results/template`,
        { base64Image: templateImage, name, term, session },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err) {
      alert('Failed to upload template: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Upload Result Template</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Template Name</label>
              <input 
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., First Term 2024/2025 Template"
              />
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Term</label>
                <select className="form-select" value={term} onChange={(e) => setTerm(e.target.value)}>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Session</label>
                <input 
                  type="text"
                  className="form-control"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  placeholder="2024/2025"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Upload Template Image</label>
              <input 
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            {templateImage && (
              <div className="border rounded p-2">
                <img src={templateImage} alt="Template" className="img-fluid" />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || !templateImage}
            >
              {uploading ? 'Uploading...' : 'Upload Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewResultModal = ({ result, token, onClose, onSuccess }) => {
  const [action, setAction] = useState('approve');
  const [comments, setComments] = useState(result.comments || {});
  const [affectiveTraits, setAffectiveTraits] = useState(result.affectiveTraits || {});
  const [processing, setProcessing] = useState(false);

  const handleReview = async () => {
    try {
      setProcessing(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/results/${result._id}/review`,
        { action, comments, affectiveTraits },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err) {
      alert('Failed to review result: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Review Result - {result.student.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Display result details and allow editing non-score fields */}
            <div className="alert alert-info">
              <strong>Note:</strong> You can edit affective traits, fees, attendance, and comments, but NOT the subject scores.
            </div>
            
            {/* Subjects (read-only) */}
            <h6 className="mb-3">Subjects & Scores (Read-Only)</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Subject</th>
                    <th>CA1</th>
                    <th>CA2</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects.map((s, i) => (
                    <tr key={i}>
                      <td>{s.subject}</td>
                      <td>{s.ca1}</td>
                      <td>{s.ca2}</td>
                      <td>{s.exam}</td>
                      <td>{s.total}</td>
                      <td><span className="badge bg-success">{s.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Comments (editable) */}
            <h6 className="mb-3">Comments</h6>
            <div className="mb-3">
              <label className="form-label">Principal's Comment</label>
              <textarea 
                className="form-control"
                rows="3"
                value={comments.principal || ''}
                onChange={(e) => setComments({ ...comments, principal: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              className="btn btn-danger me-2"
              onClick={() => { setAction('reject'); handleReview(); }}
              disabled={processing}
            >
              <X size={18} className="me-2" />
              Reject
            </button>
            <button 
              className="btn btn-success"
              onClick={() => { setAction('approve'); handleReview(); }}
              disabled={processing}
            >
              <Check size={18} className="me-2" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResultManagement;