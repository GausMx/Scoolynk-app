// src/components/Teacher/ResultPreviewModal.js - FIXED WITH DEBUG

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Download, Printer, FileText, AlertCircle } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const ResultPreviewModal = ({ result, onClose, token }) => {
  const [template, setTemplate] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplateAndSchool();
  }, []);

  const fetchTemplateAndSchool = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[Preview] Fetching template for:', { 
        term: result.term, 
        session: result.session 
      });
      console.log('[Preview] Full result object:', result);
      
      const templateRes = await axios.get(
        `${REACT_APP_API_URL}/api/teacher/results/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            term: result.term, 
            session: result.session 
          }
        }
      );
      
      console.log('[Preview] Template response:', templateRes.data);
      
      setTemplate(templateRes.data.template);
      setSchoolInfo(templateRes.data.school);
    } catch (err) {
      console.error('[Preview] Error:', err);
      setError(err.response?.data?.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
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

  if (error) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-danger">
                <AlertCircle size={20} className="me-2" />
                Error Loading Preview
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <p className="mb-2"><strong>Error:</strong> {error}</p>
                <p className="mb-0 small">Please ensure a result template is configured for this term and session.</p>
              </div>
              
              <div className="mt-3">
                <h6>Debug Information:</h6>
                <pre className="bg-light p-3 rounded small">
                  {JSON.stringify({ 
                    term: result.term, 
                    session: result.session,
                    resultId: result._id 
                  }, null, 2)}
                </pre>
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

  const components = template?.components || {};
  const student = result.student || {};
  const classInfo = result.classId || {};
  
  // Debug: Check what data we have
  console.log('[Preview] Rendering with:', {
    components,
    student,
    classInfo,
    scores: result.scores,
    hasScores: result.scores?.length > 0
  });

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" style={{ maxWidth: '90%' }}>
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-primary text-white print-hide">
            <h5 className="modal-title">
              <FileText size={20} className="me-2" />
              Result Preview - {student.name}
            </h5>
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

          {/* Modal Body - Result Sheet */}
          <div className="modal-body bg-light p-4">
            <div 
              className="bg-white shadow-lg mx-auto border" 
              style={{ 
                maxWidth: '210mm', 
                minHeight: '297mm',
                padding: '20mm'
              }}
            >
              {/* School Header */}
              {components.header?.enabled && schoolInfo && (
                <div className="text-center mb-4 pb-3 border-bottom border-2 border-primary">
                  {schoolInfo.logoUrl && (
                    <img 
                      src={schoolInfo.logoUrl} 
                      alt="School Logo" 
                      style={{ height: '80px', marginBottom: '10px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <h3 className="fw-bold text-primary mb-1">{schoolInfo.name || 'School Name'}</h3>
                  <p className="text-muted mb-1">{schoolInfo.address || 'School Address'}</p>
                  {schoolInfo.motto && (
                    <p className="fst-italic text-muted small">"{schoolInfo.motto}"</p>
                  )}
                  <div className="mt-3">
                    <h5 className="fw-bold text-dark bg-primary bg-opacity-10 py-2 px-3 rounded d-inline-block">
                      {result.term} REPORT CARD - {result.session}
                    </h5>
                  </div>
                </div>
              )}

              {/* Student Information */}
              {components.studentInfo?.enabled && (
                <div className="row mb-4 bg-light p-3 rounded">
                  <div className="col-6">
                    <p className="mb-2"><strong className="text-primary">Student Name:</strong> {student.name || 'N/A'}</p>
                    <p className="mb-2"><strong className="text-primary">Class:</strong> {classInfo.name || 'N/A'}</p>
                  </div>
                  <div className="col-6">
                    <p className="mb-2"><strong className="text-primary">Reg. Number:</strong> {student.regNo || 'N/A'}</p>
                    <p className="mb-2"><strong className="text-primary">Session:</strong> {result.session || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Scores Table */}
              {components.scoresTable?.enabled && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 bg-primary text-white p-2 rounded">
                    📚 ACADEMIC PERFORMANCE
                  </h6>
                  
                  {result.scores && result.scores.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover mb-0">
                        <thead className="table-primary">
                          <tr>
                            <th style={{ width: '5%' }} className="text-center">#</th>
                            <th style={{ width: '25%' }}>SUBJECT</th>
                            {components.scoresTable.columns
                              ?.filter(col => col.enabled)
                              .map((col, idx) => (
                                <th key={idx} className="text-center" style={{ width: '12%' }}>
                                  <div className="fw-bold">{col.name}</div>
                                  {col.maxScore > 0 && (
                                    <div className="text-muted small">({col.maxScore})</div>
                                  )}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.scores.map((score, idx) => (
                            <tr key={idx}>
                              <td className="text-center fw-semibold">{idx + 1}</td>
                              <td className="fw-semibold">{score.subject || 'N/A'}</td>
                              <td className="text-center">{score.ca1 !== undefined ? score.ca1 : '-'}</td>
                              <td className="text-center">{score.ca2 !== undefined ? score.ca2 : '-'}</td>
                              <td className="text-center">{score.exam !== undefined ? score.exam : '-'}</td>
                              <td className="text-center fw-bold bg-light">{score.total || '-'}</td>
                              <td className="text-center">
                                <span className={`badge px-3 py-2 bg-${
                                  score.grade === 'A' ? 'success' :
                                  score.grade === 'B' ? 'primary' :
                                  score.grade === 'C' ? 'info' :
                                  score.grade === 'D' ? 'warning' : 'danger'
                                }`}>
                                  {score.grade || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="table-success fw-bold">
                            <td colSpan="2" className="text-end">OVERALL TOTAL</td>
                            <td colSpan="3" className="text-center fs-5">{result.overallTotal || 0}</td>
                            <td className="text-center fs-5">{result.overallAverage || 0}%</td>
                            <td className="text-center">
                              <span className={`badge px-3 py-2 fs-6 bg-${
                                result.overallGrade === 'A' ? 'success' :
                                result.overallGrade === 'B' ? 'primary' :
                                result.overallGrade === 'C' ? 'info' :
                                result.overallGrade === 'D' ? 'warning' : 'danger'
                              }`}>
                                {result.overallGrade || '-'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      <AlertCircle size={16} className="me-2" />
                      No scores recorded for this student yet.
                    </div>
                  )}
                </div>
              )}

              {/* Affective Traits */}
              {components.affectiveTraits?.enabled && result.affectiveTraits && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 bg-info text-white p-2 rounded">
                    ⭐ AFFECTIVE TRAITS (Rating: 1-5)
                  </h6>
                  <div className="row bg-light p-3 rounded">
                    {Object.entries(result.affectiveTraits).map(([trait, rating], idx) => (
                      <div key={idx} className="col-6 col-md-4 mb-3">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                          <span className="fw-semibold">{trait}:</span>
                          <span className="badge bg-primary fs-6">{rating}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* School Fees */}
              {components.fees?.enabled && result.fees && Object.keys(result.fees).length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 bg-success text-white p-2 rounded">
                    💰 SCHOOL FEES
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <tbody>
                        {Object.entries(result.fees).map(([feeType, amount], idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-capitalize">{feeType}</td>
                            <td className="text-end">₦{amount?.toLocaleString() || '0.00'}</td>
                          </tr>
                        ))}
                        <tr className="table-success fw-bold">
                          <td>TOTAL FEES</td>
                          <td className="text-end fs-5">
                            ₦{Object.values(result.fees || {})
                              .reduce((sum, val) => sum + (Number(val) || 0), 0)
                              .toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance */}
              {components.attendance?.enabled && result.attendance && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 bg-warning text-dark p-2 rounded">
                    📅 ATTENDANCE RECORD
                  </h6>
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="border rounded p-3 bg-light">
                        <p className="mb-1 small text-muted">School Opened</p>
                        <p className="fs-3 fw-bold text-primary mb-0">{result.attendance.opened || 0}</p>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded p-3 bg-light">
                        <p className="mb-1 small text-muted">Times Present</p>
                        <p className="fs-3 fw-bold text-success mb-0">{result.attendance.present || 0}</p>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded p-3 bg-light">
                        <p className="mb-1 small text-muted">Times Absent</p>
                        <p className="fs-3 fw-bold text-danger mb-0">{result.attendance.absent || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              {components.comments?.enabled && (
                <div className="mb-4">
                  {components.comments.teacher && result.teacherComment && (
                    <div className="mb-3">
                      <h6 className="fw-bold text-primary mb-2">📝 CLASS TEACHER'S COMMENT</h6>
                      <div className="border border-primary rounded p-3 bg-light">
                        <p className="mb-0 fst-italic">{result.teacherComment}</p>
                      </div>
                    </div>
                  )}
                  
                  {components.comments.principal && result.principalComment && (
                    <div>
                      <h6 className="fw-bold text-success mb-2">🎓 PRINCIPAL'S COMMENT</h6>
                      <div className="border border-success rounded p-3 bg-light">
                        <p className="mb-0 fst-italic">{result.principalComment}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Signatures */}
              {components.signatures?.enabled && (
                <div className="row mt-5 pt-4">
                  <div className="col-6 text-center">
                    <div className="border-top border-dark border-2 pt-2">
                      <small className="fw-bold text-uppercase">Class Teacher's Signature</small>
                      <p className="text-muted small mb-0 mt-1">Date: ___________</p>
                    </div>
                  </div>
                  <div className="col-6 text-center">
                    <div className="border-top border-dark border-2 pt-2">
                      <small className="fw-bold text-uppercase">Principal's Signature</small>
                      <p className="text-muted small mb-0 mt-1">Date: ___________</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-5 pt-3 border-top">
                <small className="text-muted">
                  Generated on {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • 
                  Status: <span className={`text-uppercase fw-bold ${
                    result.status === 'approved' ? 'text-success' :
                    result.status === 'rejected' ? 'text-danger' :
                    result.status === 'submitted' ? 'text-primary' : 'text-secondary'
                  }`}>{result.status}</span>
                </small>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light print-hide">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              <X size={16} className="me-2" />
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handlePrint}
            >
              <Printer size={16} className="me-2" />
              Print Result
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
          .modal-body {
            padding: 0 !important;
            background: white !important;
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