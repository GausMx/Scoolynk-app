import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Eye, Check, Send, Plus, Edit2,
  AlertCircle, CheckCircle, Clock, Trash2, X
} from 'lucide-react';
import VisualTemplateBuilder from './VisualTemplateBuilder';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const AdminResultManagement = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'pending') {
      fetchPendingResults();
    } else if (activeTab === 'all') {
      fetchAllResults();
    }
  }, [activeTab, selectedTerm, selectedSession]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);
      
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLoadingPercent(70);
      setTemplates(res.data.templates || []);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      showMessage('error', 'Failed to load templates.');
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);
      
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/admin/results/submitted`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term: selectedTerm, session: selectedSession }
        }
      );
      
      setLoadingPercent(70);
      setResults(res.data.results || []);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch pending results:', err);
      showMessage('error', 'Failed to load pending results.');
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const fetchAllResults = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);
      
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/admin/results`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term: selectedTerm, session: selectedSession }
        }
      );
      
      setLoadingPercent(70);
      setResults(res.data.results || []);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      showMessage('error', 'Failed to load results.');
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const deleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${REACT_APP_API_URL}/api/admin/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Template deleted successfully');
      fetchTemplates();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      {!showTemplateBuilder ? (
        <div className="card shadow-lg rounded-4 p-3 p-md-4 mb-4 border-0">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 border-bottom pb-3 gap-3">
            <div>
              <h4 className="fw-bold text-primary d-flex align-items-center mb-2 fs-5 fs-md-4">
                <FileText size={24} className="me-2" /> Result Management
              </h4>
              <p className="text-muted mb-0 small">Manage result templates and review student results</p>
            </div>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
            </div>
          )}

          {/* Tabs */}
          <ul className="nav nav-pills mb-4 gap-2 flex-column flex-md-row">
            <li className="nav-item w-100 w-md-auto">
              <button 
                className={`nav-link rounded-3 w-100 d-flex align-items-center justify-content-center ${activeTab === 'templates' ? 'active' : ''}`}
                onClick={() => setActiveTab('templates')}
              >
                <FileText size={16} className="me-2" />
                <span className="small">Templates</span>
              </button>
            </li>
            <li className="nav-item w-100 w-md-auto">
              <button 
                className={`nav-link rounded-3 w-100 d-flex align-items-center justify-content-center ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <Clock size={16} className="me-2" />
                <span className="small">Pending</span>
                {results.filter(r => r.status === 'submitted').length > 0 && (
                  <span className="badge bg-danger ms-2">
                    {results.filter(r => r.status === 'submitted').length}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item w-100 w-md-auto">
              <button 
                className={`nav-link rounded-3 w-100 d-flex align-items-center justify-content-center ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <CheckCircle size={16} className="me-2" />
                <span className="small">All Results</span>
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          {activeTab === 'templates' && (
            <TemplatesTab 
              templates={templates}
              onCreateNew={() => {
                setEditingTemplate(null);
                setShowTemplateBuilder(true);
              }}
              onEdit={(template) => {
                setEditingTemplate(template);
                setShowTemplateBuilder(true);
              }}
              onDelete={deleteTemplate}
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
                showMessage('success', 'Result reviewed successfully!');
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
              onActionSuccess={() => {
                showMessage('success', 'Action completed successfully!');
                fetchAllResults();
              }}
            />
          )}
        </div>
      ) : (
        <VisualTemplateBuilder
          schoolId={JSON.parse(localStorage.getItem('user'))?.schoolId}
          token={token}
          existingTemplate={editingTemplate}
          onClose={() => {
            setShowTemplateBuilder(false);
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
};

// ==================== TEMPLATES TAB ====================
const TemplatesTab = ({ templates, onCreateNew, onEdit, onDelete }) => {
  const activeTemplates = templates.filter(t => t.isActive);
  const inactiveTemplates = templates.filter(t => !t.isActive);

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h5 className="mb-0">Result Templates</h5>
        <button 
          className="btn btn-primary rounded-3 w-100 w-md-auto"
          onClick={onCreateNew}
        >
          <Plus size={18} className="me-2" />
          Create New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="alert alert-info rounded-3">
          <AlertCircle size={20} className="me-2" />
          No templates created yet. Create a template to get started with result entry.
        </div>
      ) : (
        <>
          {/* Active Templates */}
          {activeTemplates.length > 0 && (
            <>
              <h6 className="text-success mb-3">
                <CheckCircle size={18} className="me-2" />
                Active Templates ({activeTemplates.length})
              </h6>
              <div className="row g-3 g-md-4 mb-4">
                {activeTemplates.map(template => (
                  <div key={template._id} className="col-12 col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-success border-4">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold">{template.name}</h6>
                            <small className="text-muted">
                              {template.term} - {template.session}
                            </small>
                          </div>
                          <span className="badge bg-success">Active</span>
                        </div>
                        
                        <div className="border-top pt-3 mt-3">
                          <div className="text-muted small mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>Created by:</span>
                              <span className="fw-semibold">{template.createdBy?.name || 'N/A'}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Date:</span>
                              <span className="fw-semibold">{new Date(template.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <button 
                            className="btn btn-sm btn-outline-primary rounded-3 w-100"
                            onClick={() => onEdit(template)}
                          >
                            <Edit2 size={14} className="me-1" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Inactive Templates */}
          {inactiveTemplates.length > 0 && (
            <>
              <h6 className="text-secondary mb-3">
                <AlertCircle size={18} className="me-2" />
                Inactive Templates ({inactiveTemplates.length})
              </h6>
              <div className="row g-3 g-md-4">
                {inactiveTemplates.map(template => (
                  <div key={template._id} className="col-12 col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-light">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold text-muted">{template.name}</h6>
                            <small className="text-muted">
                              {template.term} - {template.session}
                            </small>
                          </div>
                          <span className="badge bg-secondary">Inactive</span>
                        </div>
                        
                        <div className="border-top pt-3 mt-3">
                          <div className="text-muted small mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>Created by:</span>
                              <span className="fw-semibold">{template.createdBy?.name || 'N/A'}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Deactivated:</span>
                              <span className="fw-semibold">{new Date(template.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <button 
                            className="btn btn-sm btn-outline-danger rounded-3 w-100"
                            onClick={() => onDelete(template._id, template.name)}
                          >
                            <Trash2 size={14} className="me-1" />
                            Delete Permanently
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

// ==================== RESULT PREVIEW MODAL ====================
const ResultPreviewModal = ({ result, onClose, onApprove, onReject, showActions = false }) => {
  const [reviewing, setReviewing] = useState(false);

  const handleReview = async (action) => {
    setReviewing(true);
    try {
      if (action === 'approve') {
        await onApprove(result._id);
      } else {
        await onReject(result._id);
      }
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <Eye size={20} className="me-2" />
              Result Preview - {result.student.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Student Info */}
            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong className="d-block text-muted small mb-1">Student Name</strong>
                    <span className="fw-bold">{result.student.name}</span>
                  </div>
                  <div className="col-md-6">
                    <strong className="d-block text-muted small mb-1">Registration Number</strong>
                    <span className="fw-bold">{result.student.regNo}</span>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Class</strong>
                    <span className="badge bg-info">{result.classId.name}</span>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Term</strong>
                    <span>{result.term}</span>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Session</strong>
                    <span>{result.session}</span>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Teacher</strong>
                    <span>{result.teacher.name}</span>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Status</strong>
                    <span className={`badge bg-${
                      result.status === 'draft' ? 'secondary' :
                      result.status === 'submitted' ? 'primary' :
                      result.status === 'approved' ? 'success' :
                      result.status === 'rejected' ? 'danger' : 'info'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  {result.submittedAt && (
                    <div className="col-md-4">
                      <strong className="d-block text-muted small mb-1">Submitted At</strong>
                      <span>{new Date(result.submittedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <h6 className="mb-3">Subject Scores</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Subject</th>
                    <th className="text-center">CA (40)</th>
                    <th className="text-center">Exam (60)</th>
                    <th className="text-center">Total (100)</th>
                    <th className="text-center">Grade</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects && result.subjects.length > 0 ? (
                    result.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td className="fw-semibold">{subject.name}</td>
                        <td className="text-center">{subject.ca}</td>
                        <td className="text-center">{subject.exam}</td>
                        <td className="text-center fw-bold">{subject.total}</td>
                        <td className="text-center">
                          <span className={`badge bg-${
                            subject.grade === 'A' ? 'success' :
                            subject.grade === 'B' ? 'primary' :
                            subject.grade === 'C' ? 'info' :
                            subject.grade === 'D' ? 'warning' : 'danger'
                          }`}>
                            {subject.grade}
                          </span>
                        </td>
                        <td>{subject.remark}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">No subjects recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Overall Performance */}
            <div className="card border-0 bg-primary bg-opacity-10 mb-4">
              <div className="card-body">
                <h6 className="mb-3">Overall Performance</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Total Score</strong>
                    <h4 className="fw-bold mb-0">{result.overallTotal}</h4>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Average</strong>
                    <h4 className="fw-bold mb-0">{result.overallAverage?.toFixed(2) || 'N/A'}%</h4>
                  </div>
                  <div className="col-md-4">
                    <strong className="d-block text-muted small mb-1">Grade</strong>
                    <h4 className="mb-0">
                      <span className={`badge bg-${
                        result.overallGrade === 'A' ? 'success' :
                        result.overallGrade === 'B' ? 'primary' :
                        result.overallGrade === 'C' ? 'info' :
                        result.overallGrade === 'D' ? 'warning' : 'danger'
                      }`}>
                        {result.overallGrade}
                      </span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            {(result.teacherComment || result.principalComment) && (
              <div className="card border-0 bg-light">
                <div className="card-body">
                  <h6 className="mb-3">Comments</h6>
                  {result.teacherComment && (
                    <div className="mb-3">
                      <strong className="d-block text-muted small mb-1">Teacher's Comment</strong>
                      <p className="mb-0">{result.teacherComment}</p>
                    </div>
                  )}
                  {result.principalComment && (
                    <div>
                      <strong className="d-block text-muted small mb-1">Principal's Comment</strong>
                      <p className="mb-0">{result.principalComment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {showActions && result.status === 'submitted' && (
              <>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => handleReview('reject')}
                  disabled={reviewing}
                >
                  {reviewing ? 'Processing...' : 'Reject'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => handleReview('approve')}
                  disabled={reviewing}
                >
                  {reviewing ? 'Processing...' : 'Approve & Send to Parent'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const [approvingAll, setApprovingAll] = useState(false);

  const pendingResults = results.filter(r => r.status === 'submitted');

  const approveAll = async () => {
    if (pendingResults.length === 0) return;

    if (!window.confirm(`Approve all ${pendingResults.length} results? They will be approved and sent to parents via SMS.`)) {
      return;
    }

    try {
      setApprovingAll(true);
      
      for (const result of pendingResults) {
        await axios.put(
          `${REACT_APP_API_URL}/api/admin/results/${result._id}/review`,
          { action: 'approve' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert(`Successfully approved ${pendingResults.length} results and sent them to parents!`);
      onReviewSuccess();
    } catch (err) {
      alert('Failed to approve all results: ' + (err.response?.data?.message || err.message));
    } finally {
      setApprovingAll(false);
    }
  };

  const handleApprove = async (resultId) => {
    try {
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/results/${resultId}/review`,
        { action: 'approve' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedResult(null);
      onReviewSuccess();
    } catch (err) {
      alert('Failed to approve result: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (resultId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/results/${resultId}/review`,
        { action: 'reject', reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedResult(null);
      onReviewSuccess();
    } catch (err) {
      alert('Failed to reject result: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Filters - Mobile Optimized */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <select 
            className="form-select rounded-3" 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <input 
            type="text" 
            className="form-control rounded-3" 
            placeholder="Session (e.g., 2024/2025)"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-6 text-end">
          {pendingResults.length > 0 && (
            <button 
              className="btn btn-success rounded-3 w-100 w-md-auto"
              onClick={approveAll}
              disabled={approvingAll}
            >
              {approvingAll ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Approving...
                </>
              ) : (
                <>
                  <Check size={18} className="me-2" />
                  Approve All ({pendingResults.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loading percentage={100} />
      ) : (
        <>
          {pendingResults.length === 0 ? (
            <div className="alert alert-success rounded-3">
              <CheckCircle size={20} className="me-2" />
              No pending results to review. All caught up!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th className="small">Student</th>
                    <th className="small d-none d-md-table-cell">Class</th>
                    <th className="small d-none d-lg-table-cell">Teacher</th>
                    <th className="small d-none d-md-table-cell">Subjects</th>
                    <th className="small">Overall</th>
                    <th className="small">Grade</th>
                    <th className="small d-none d-lg-table-cell">Submitted</th>
                    <th className="text-center small">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingResults.map(result => (
                    <tr key={result._id}>
                      <td>
                        <div className="fw-semibold small">{result.student.name}</div>
                        <small className="text-muted d-block d-md-none">{result.classId.name}</small>
                      </td>
                      <td className="d-none d-md-table-cell"><span className="badge bg-info">{result.classId.name}</span></td>
                      <td className="d-none d-lg-table-cell small">{result.teacher.name}</td>
                      <td className="d-none d-md-table-cell">{result.subjects?.length || 0}</td>
                      <td className="fw-bold small">{result.overallTotal}</td>
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
                      <td className="d-none d-lg-table-cell">
                        <small>{new Date(result.submittedAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            className="btn btn-sm btn-primary rounded-3"
                            onClick={() => setSelectedResult(result)}
                          >
                            <Eye size={14} className="d-none d-md-inline me-1" />
                            <span className="small">Review</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {selectedResult && (
        <ResultPreviewModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          showActions={true}
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
  token,
  onActionSuccess
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResults, setSelectedResults] = useState([]);
  const [previewResult, setPreviewResult] = useState(null);

  const filteredResults = results.filter(r => 
    (statusFilter === 'all' || r.status === statusFilter) &&
    (!selectedTerm || r.term === selectedTerm) &&
    (!selectedSession || r.session === selectedSession)
  );

  const approvedResults = filteredResults.filter(r => r.status === 'approved');

  const sendMultipleResults = async () => {
    if (selectedResults.length === 0) {
      alert('Please select results to send');
      return;
    }

    if (!window.confirm(`Send ${selectedResults.length} result(s) to parents via SMS?`)) {
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
      onActionSuccess();
    } catch (err) {
      alert('Failed to send results: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      {/* Filters - Mobile Optimized */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-md-3 col-lg-2">
          <select 
            className="form-select form-select-sm rounded-3" 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="">All Terms</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <input 
            type="text" 
            className="form-control form-control-sm rounded-3" 
            placeholder="Session"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3 col-lg-2">
          <select 
            className="form-select form-select-sm rounded-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sent">Sent to Parents</option>
          </select>
        </div>
        <div className="col-12 col-md-3 col-lg-6 text-md-end">
          {selectedResults.length > 0 && (
            <button 
              className="btn btn-sm btn-success rounded-3 w-100 w-md-auto"
              onClick={sendMultipleResults}
            >
              <Send size={16} className="me-2" />
              <span className="d-none d-sm-inline">Send </span>{selectedResults.length}<span className="d-none d-sm-inline"> to Parents</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loading percentage={100} />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="d-md-none">
            {filteredResults.length === 0 ? (
              <div className="alert alert-info rounded-3">
                <AlertCircle size={20} className="me-2" />
                No results found matching your filters.
              </div>
            ) : (
              <div className="row g-3">
                {filteredResults.map(result => (
                  <div key={result._id} className="col-12">
                    <div className="card border-0 shadow-sm rounded-3">
                      <div className="card-body p-3">
                        {/* Header with checkbox */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-start gap-2">
                              {result.status === 'approved' && (
                                <input 
                                  type="checkbox"
                                  className="form-check-input mt-1"
                                  checked={selectedResults.includes(result._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedResults([...selectedResults, result._id]);
                                    } else {
                                      setSelectedResults(selectedResults.filter(id => id !== result._id));
                                    }
                                  }}
                                  aria-label={`Select result for ${result.student.name}`}
                                />
                              )}
                              <div>
                                <h6 className="mb-1 fw-bold">{result.student.name}</h6>
                                <small className="text-muted d-block">{result.student.regNo}</small>
                              </div>
                            </div>
                          </div>
                          <span className={`badge bg-${
                            result.status === 'draft' ? 'secondary' :
                            result.status === 'submitted' ? 'primary' :
                            result.status === 'approved' ? 'success' :
                            result.status === 'rejected' ? 'danger' : 'info'
                          }`}>
                            {result.status}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <small className="text-muted d-block">Class</small>
                            <span className="badge bg-info">{result.classId.name}</span>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Grade</small>
                            <span className={`badge bg-${
                              result.overallGrade === 'A' ? 'success' :
                              result.overallGrade === 'B' ? 'primary' :
                              result.overallGrade === 'C' ? 'info' :
                              result.overallGrade === 'D' ? 'warning' : 'danger'
                            }`}>
                              {result.overallGrade}
                            </span>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Overall Score</small>
                            <span className="fw-bold">{result.overallTotal}</span>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Term</small>
                            <span className="small">{result.term}</span>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Session</small>
                            <span className="small">{result.session}</span>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Teacher</small>
                            <span className="small">{result.teacher.name}</span>
                          </div>
                        </div>

                        {/* Preview Button */}
                        <button 
                          className="btn btn-sm btn-outline-primary rounded-3 w-100"
                          onClick={() => setPreviewResult(result)}
                        >
                          <Eye size={14} className="me-1" />
                          Preview Result
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="d-none d-md-block table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedResults.length === approvedResults.length && approvedResults.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResults(approvedResults.map(r => r._id));
                        } else {
                          setSelectedResults([]);
                        }
                      }}
                      aria-label="Select all approved results"
                    />
                  </th>
                  <th className="small">Student</th>
                  <th className="small">Class</th>
                  <th className="small d-none d-lg-table-cell">Term</th>
                  <th className="small d-none d-lg-table-cell">Session</th>
                  <th className="small">Overall</th>
                  <th className="small">Grade</th>
                  <th className="small">Status</th>
                  <th className="small d-none d-lg-table-cell">Teacher</th>
                  <th className="small text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(result => (
                  <tr key={result._id}>
                    <td>
                      {result.status === 'approved' && (
                        <input 
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedResults.includes(result._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResults([...selectedResults, result._id]);
                            } else {
                              setSelectedResults(selectedResults.filter(id => id !== result._id));
                            }
                          }}
                          aria-label={`Select result for student ${result.student.name}`}
                        />
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold small">{result.student.name}</div>
                      <small className="text-muted">{result.student.regNo}</small>
                    </td>
                    <td><span className="badge bg-info">{result.classId.name}</span></td>
                    <td className="d-none d-lg-table-cell small">{result.term}</td>
                    <td className="d-none d-lg-table-cell small">{result.session}</td>
                    <td className="fw-bold small">{result.overallTotal}</td>
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
                    <td className="d-none d-lg-table-cell">
                      <small>{result.teacher.name}</small>
                    </td>
                    <td className="text-center">
                      <button 
                        className="btn btn-sm btn-outline-primary rounded-3"
                        onClick={() => setPreviewResult(result)}
                      >
                        <Eye size={14} className="me-1" />
                        <span className="small">Preview</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewResult && (
        <ResultPreviewModal
          result={previewResult}
          onClose={() => setPreviewResult(null)}
          showActions={false}
        />
      )}
    </>
  );
};

export default AdminResultManagement;