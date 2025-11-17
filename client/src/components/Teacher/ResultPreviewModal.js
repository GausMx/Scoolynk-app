// src/components/Teacher/ResultPreviewModal.js - ACCURATE DATA FETCH

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Eye, Printer, AlertCircle } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const ResultPreviewModal = ({ result, onClose, token }) => {
  const [fullResult, setFullResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFullResult();
  }, []);

  const fetchFullResult = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch the complete result with all populated fields
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/teacher/results/${result._id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      console.log('[Preview] Full result data:', res.data);
      setFullResult(res.data.result || res.data);
      
    } catch (err) {
      console.error('[Preview] Error:', err);
      setError(err.response?.data?.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading result preview...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fullResult) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <AlertCircle size={20} className="me-2" />
                Error Loading Result
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <p className="mb-0">{error || 'Failed to load result data'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-info text-white print-hide">
            <div>
              <h5 className="modal-title mb-0">
                <Eye size={20} className="me-2" />
                Result Preview
              </h5>
              <small>{fullResult.student?.name} - {fullResult.classId?.name}</small>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button 
                className="btn btn-sm btn-light"
                onClick={handlePrint}
                title="Print"
              >
                <Printer size={16} />
              </button>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Status Alert */}
            {fullResult.status === 'approved' && (
              <div className="alert alert-success rounded-3 d-flex align-items-center mb-3">
                <div className="me-3">✓</div>
                <div>
                  <strong>Result Approved</strong>
                  <p className="mb-0 small mt-1">
                    This result was approved and sent to {fullResult.student?.parentName || 'parent'} 
                    ({fullResult.student?.parentPhone || 'N/A'})
                  </p>
                </div>
              </div>
            )}
            
            {/* Student Info */}
            <div className="card bg-light mb-3">
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Student</small>
                    <strong className="small">{fullResult.student?.name}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Reg No</small>
                    <strong className="small">{fullResult.student?.regNo}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Class</small>
                    <strong className="small">{fullResult.classId?.name}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Term</small>
                    <strong className="small">{fullResult.term} - {fullResult.session}</strong>
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
                  {fullResult.subjects?.length > 0 ? (
                    fullResult.subjects.map((s, i) => (
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
                    ))
                  ) : fullResult.scores?.length > 0 ? (
                    // Try 'scores' field if 'subjects' doesn't exist
                    fullResult.scores.map((s, i) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No scores available
                      </td>
                    </tr>
                  )}
                  
                  {/* Overall Row */}
                  {(fullResult.overallTotal !== undefined || fullResult.overallGrade) && (
                    <tr className="table-secondary">
                      <td colSpan="4" className="fw-bold small">Overall Performance</td>
                      <td className="text-center fw-bold small">{fullResult.overallTotal || 0}</td>
                      <td className="text-center">
                        <span className={`badge bg-${
                          fullResult.overallGrade === 'A' ? 'success' :
                          fullResult.overallGrade === 'B' ? 'primary' :
                          fullResult.overallGrade === 'C' ? 'info' :
                          fullResult.overallGrade === 'D' ? 'warning' : 'danger'
                        }`}>
                          {fullResult.overallGrade}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Affective Traits */}
            {fullResult.affectiveTraits && Object.keys(fullResult.affectiveTraits).length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 fw-bold">Affective Traits</h6>
                <div className="row">
                  {Object.entries(fullResult.affectiveTraits).map(([trait, rating], idx) => (
                    <div key={idx} className="col-6 col-md-4 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="small">{trait}:</span>
                        <span className="fw-bold small">{rating}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance */}
            {fullResult.attendance && (
              <div className="mb-4">
                <h6 className="mb-3 fw-bold">Attendance</h6>
                <div className="row">
                  <div className="col-4">
                    <small className="text-muted d-block">School Opened</small>
                    <strong>{fullResult.attendance.opened || 0}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Times Present</small>
                    <strong className="text-success">{fullResult.attendance.present || 0}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Times Absent</small>
                    <strong className="text-danger">{fullResult.attendance.absent || 0}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            {(fullResult.comments?.teacher || fullResult.comments?.principal || 
              fullResult.teacherComment || fullResult.principalComment) && (
              <div className="mb-4">
                <h6 className="mb-3 fw-bold">Comments</h6>
                
                {(fullResult.comments?.teacher || fullResult.teacherComment) && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Teacher's Comment</label>
                    <div className="card bg-light">
                      <div className="card-body">
                        <p className="mb-0 small">
                          {fullResult.comments?.teacher || fullResult.teacherComment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(fullResult.comments?.principal || fullResult.principalComment) && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Principal's Comment</label>
                    <div className="card bg-light">
                      <div className="card-body">
                        <p className="mb-0 small">
                          {fullResult.comments?.principal || fullResult.principalComment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fees */}
            {fullResult.fees && Object.keys(fullResult.fees).length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 fw-bold">School Fees</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <tbody>
                      {Object.entries(fullResult.fees).map(([feeType, amount], idx) => (
                        <tr key={idx}>
                          <td className="text-capitalize small">{feeType}</td>
                          <td className="text-end small">₦{amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approval Info */}
            {fullResult.approvedAt && (
              <div className="card border-success mt-3">
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <small className="text-muted d-block">Approved By</small>
                      <strong className="small">{fullResult.approvedBy?.name || 'Admin'}</strong>
                    </div>
                    <div className="col-12 col-md-6">
                      <small className="text-muted d-block">Approved On</small>
                      <strong className="small">
                        {new Date(fullResult.approvedAt).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info (can be removed in production) */}
            <details className="mt-3">
              <summary className="text-muted small" style={{ cursor: 'pointer' }}>
                Debug: View Raw Data
              </summary>
              <pre className="bg-light p-3 rounded small mt-2" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(fullResult, null, 2)}
              </pre>
            </details>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer print-hide">
            <button 
              type="button" 
              className="btn btn-secondary rounded-3" 
              onClick={onClose}
            >
              <X size={16} className="me-2" />
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-primary rounded-3"
              onClick={handlePrint}
            >
              <Printer size={16} className="me-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          .modal {
            position: static !important;
            background: white !important;
          }
          .modal-dialog {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultPreviewModal;