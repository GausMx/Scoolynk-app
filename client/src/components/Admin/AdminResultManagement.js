
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Eye, Check, Send, Plus, Edit2,
  AlertCircle, CheckCircle, Clock, Trash2
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
                            onClick={() => {
                              setSelectedResult(result);
                              setShowReviewModal(true);
                            }}
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
  token,
  onActionSuccess
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResults, setSelectedResults] = useState([]);
  const [previewResult, setPreviewResult] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const filteredResults = results.filter(r => 
    statusFilter === 'all' || r.status === statusFilter
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
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3 col-lg-2">
          <select 
            className="form-select rounded-3" 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="">All Terms</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-12 col-md-3 col-lg-2">
          <input 
            type="text" 
            className="form-control rounded-3" 
            placeholder="Session"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3 col-lg-2">
          <select 
            className="form-select rounded-3"
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
              className="btn btn-success rounded-3 w-100 w-md-auto"
              onClick={sendMultipleResults}
            >
              <Send size={18} className="me-2" />
              Send {selectedResults.length} to Parents
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loading percentage={100} />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
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
                  />
                </th>
                <th className="small">Student</th>
                <th className="small d-none d-md-table-cell">Class</th>
                <th className="small d-none d-lg-table-cell">Term</th>
                <th className="small d-none d-lg-table-cell">Session</th>
                <th className="small">Overall</th>
                <th className="small">Grade</th>
                <th className="small">Status</th>
                <th className="small d-none d-lg-table-cell">Teacher</th>
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
                      />
                    )}
                  </td>
                  <td>
                    <div className="fw-semibold small">{result.student.name}</div>
                    <small className="text-muted">{result.student.regNo}</small>
                    <div className="d-md-none">
                      <span className="badge bg-info mt-1">{result.classId.name}</span>
                    </div>
                  </td>
                  <td className="d-none d-md-table-cell"><span className="badge bg-info">{result.classId.name}</span></td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ==================== REVIEW MODAL ====================
const ReviewResultModal = ({ result, token, onClose, onSuccess }) => {
  const [comments, setComments] = useState({
    teacher: result.comments?.teacher || '',
    principal: result.comments?.principal || ''
  });
  const [processing, setProcessing] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/results/${result._id}/review`,
        { action: 'approve', comments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Result approved! It will be sent to parents via SMS.');
      onSuccess();
    } catch (err) {
      alert('Failed to approve result: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
      setShowApproveConfirm(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;

    try {
      setProcessing(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/results/${result._id}/review`,
        { action: 'reject', rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Result rejected and sent back to teacher.');
      onSuccess();
    } catch (err) {
      alert('Failed to reject result: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <div>
              <h5 className="modal-title mb-0">Review Result</h5>
              <small>{result.student.name} - {result.classId.name}</small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info rounded-3">
              <strong>Note:</strong> Review the result details below. You can add/edit the principal's comment before approving.
            </div>
            
            {/* Subjects (read-only) */}
            <h6 className="mb-3 fw-bold">Subject Scores</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th className="small">Subject</th>
                    <th className="text-center small">CA1</th>
                    <th className="text-center small">CA2</th>
                    <th className="text-center small">Exam</th>
                    <th className="text-center small">Total</th>
                    <th className="text-center small">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects?.map((s, i) => (
                    <tr key={i}>
                      <td className="fw-semibold small">{s.subject}</td>
                      <td className="text-center small">{s.ca1}</td>
                      <td className="text-center small">{s.ca2}</td>
                      <td className="text-center small">{s.exam}</td>
                      <td className="text-center fw-bold small">{s.total}</td>
                      <td className="text-center">
                        <span className={`badge bg-${
                          s.grade === 'A' ? 'success' :
                          s.grade === 'B' ? 'primary' :
                          s.grade === 'C' ? 'info' :
                          s.grade === 'D' ? 'warning' : 'danger'
                        }`}>
                          {s.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td colSpan="4" className="fw-bold small">Overall Performance</td>
                    <td className="text-center fw-bold small">{result.overallTotal}</td>
                    <td className="text-center">
                      <span className={`badge bg-${
                        result.overallGrade === 'A' ? 'success' :
                        result.overallGrade === 'B' ? 'primary' :
                        result.overallGrade === 'C' ? 'info' :
                        result.overallGrade === 'D' ? 'warning' : 'danger'
                      }`}>
                        {result.overallGrade}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Comments */}
            <h6 className="mb-3 fw-bold">Comments</h6>
            <div className="mb-3">
              <label className="form-label small">Teacher's Comment (Read-only)</label>
              <textarea 
                className="form-control bg-light"
                rows="3"
                value={comments.teacher}
                readOnly
              ></textarea>
            </div>

            <div className="mb-3">
              <label className="form-label small">Principal's Comment</label>
              <textarea 
                className="form-control"
                rows="3"
                value={comments.principal || ''}
                onChange={(e) => setComments({ ...comments, principal: e.target.value })}
                placeholder="Add principal's comment here..."
              ></textarea>
            </div>
          </div>
          <div className="modal-footer flex-column flex-md-row gap-2">
            <button className="btn btn-secondary rounded-3 w-100 w-md-auto order-3 order-md-1" onClick={onClose} disabled={processing}>
              Cancel
            </button>
            <button 
              className="btn btn-danger rounded-3 w-100 w-md-auto order-2 order-md-2"
              onClick={handleReject}
              disabled={processing}
            >
              <Check size={18} className="me-2" />
              Reject
            </button>
            <button 
              className="btn btn-success rounded-3 w-100 w-md-auto order-1 order-md-3"
              onClick={() => setShowApproveConfirm(true)}
              disabled={processing}
            >
              <Check size={18} className="me-2" />
              Approve & Send to Parent
            </button>
          </div>

          {/* Approve Confirmation Modal */}
          {showApproveConfirm && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header bg-success text-white">
                    <h5 className="modal-title">
                      <Check size={20} className="me-2" />
                      Confirm Approval
                    </h5>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-warning">
                      <AlertCircle size={20} className="me-2" />
                      <strong>Important:</strong> Once approved, this result will be automatically sent to the parent via SMS.
                    </div>
                    
                    <h6 className="mb-3">Result Summary:</h6>
                    <div className="card bg-light">
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-12 col-md-6">
                            <strong className="small">Student:</strong> <span className="small">{result.student.name}</span>
                          </div>
                          <div className="col-12 col-md-6">
                            <strong className="small">Class:</strong> <span className="small">{result.classId.name}</span>
                          </div>
                          <div className="col-12 col-md-6">
                            <strong className="small">Overall Score:</strong> <span className="small">{result.overallTotal}</span>
                          </div>
                          <div className="col-12 col-md-6">
                            <strong className="small">Grade:</strong> <span className="badge bg-success">{result.overallGrade}</span>
                          </div>
                          <div className="col-12 mt-2">
                            <strong className="small">Parent:</strong> <span className="small">{result.student.parentName || 'N/A'} 
                            ({result.student.parentPhone || 'No phone number'})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 mb-0 small">Are you sure you want to approve and send this result?</p>
                  </div>
                  <div className="modal-footer flex-column flex-md-row gap-2">
                    <button 
                      className="btn btn-secondary w-100 w-md-auto order-2 order-md-1"
                      onClick={() => setShowApproveConfirm(false)}
                      disabled={processing}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-success w-100 w-md-auto order-1 order-md-2"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check size={18} className="me-2" />
                          Yes, Approve & Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== PREVIEW MODAL (Read-only) ====================
const PreviewResultModal = ({ result, onClose }) => {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <div>
              <h5 className="modal-title mb-0">
                <Eye size={20} className="me-2" />
                Result Preview (Sent to Parent)
              </h5>
              <small>{result.student.name} - {result.classId.name}</small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-success rounded-3 d-flex align-items-center">
              <CheckCircle size={20} className="me-2 flex-shrink-0" />
              <div>
                <strong>Result Sent Successfully!</strong>
                <p className="mb-0 small mt-1">
                  This result was approved and sent to {result.student.parentName || 'parent'} 
                  ({result.student.parentPhone || 'N/A'}) via SMS.
                </p>
              </div>
            </div>
            
            {/* Student Info */}
            <div className="card bg-light mb-3">
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Student</small>
                    <strong className="small">{result.student.name}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Reg No</small>
                    <strong className="small">{result.student.regNo}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Class</small>
                    <strong className="small">{result.classId.name}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Term</small>
                    <strong className="small">{result.term} - {result.session}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Scores */}
            <h6 className="mb-3 fw-bold">Subject Scores</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th className="small">Subject</th>
                    <th className="text-center small">CA1</th>
                    <th className="text-center small">CA2</th>
                    <th className="text-center small">Exam</th>
                    <th className="text-center small">Total</th>
                    <th className="text-center small">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects?.map((s, i) => (
                    <tr key={i}>
                      <td className="fw-semibold small">{s.subject}</td>
                      <td className="text-center small">{s.ca1}</td>
                      <td className="text-center small">{s.ca2}</td>
                      <td className="text-center small">{s.exam}</td>
                      <td className="text-center fw-bold small">{s.total}</td>
                      <td className="text-center">
                        <span className={`badge bg-${
                          s.grade === 'A' ? 'success' :
                          s.grade === 'B' ? 'primary' :
                          s.grade === 'C' ? 'info' :
                          s.grade === 'D' ? 'warning' : 'danger'
                        }`}>
                          {s.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td colSpan="4" className="fw-bold small">Overall Performance</td>
                    <td className="text-center fw-bold small">{result.overallTotal}</td>
                    <td className="text-center">
                      <span className={`badge bg-${
                        result.overallGrade === 'A' ? 'success' :
                        result.overallGrade === 'B' ? 'primary' :
                        result.overallGrade === 'C' ? 'info' :
                        result.overallGrade === 'D' ? 'warning' : 'danger'
                      }`}>
                        {result.overallGrade}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Comments */}
            <h6 className="mb-3 fw-bold">Comments</h6>
            {result.comments?.teacher && (
              <div className="mb-3">
                <label className="form-label small fw-semibold">Teacher's Comment</label>
                <div className="card bg-light">
                  <div className="card-body">
                    <p className="mb-0 small">{result.comments.teacher}</p>
                  </div>
                </div>
              </div>
            )}

            {result.comments?.principal && (
              <div className="mb-3">
                <label className="form-label small fw-semibold">Principal's Comment</label>
                <div className="card bg-light">
                  <div className="card-body">
                    <p className="mb-0 small">{result.comments.principal}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Info */}
            {result.approvedAt && (
              <div className="card border-success mt-3">
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <small className="text-muted d-block">Approved By</small>
                      <strong className="small">{result.approvedBy?.name || 'Admin'}</strong>
                    </div>
                    <div className="col-12 col-md-6">
                      <small className="text-muted d-block">Approved On</small>
                      <strong className="small">{new Date(result.approvedAt).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary rounded-3 w-100 w-md-auto" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResultManagement;