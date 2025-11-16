// src/components/Teacher/ResultPreviewModal.js - Full Result Preview

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Download, Printer, FileText } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const ResultPreviewModal = ({ result, onClose, token }) => {
  const [template, setTemplate] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplateAndSchool();
  }, []);

  const fetchTemplateAndSchool = async () => {
    try {
      setLoading(true);
      
      // Fetch template
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
      
      setTemplate(templateRes.data.template);
      setSchoolInfo(templateRes.data.school);
    } catch (err) {
      console.error('Failed to fetch template/school:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF or image download
    alert('Download functionality - to be implemented with html2canvas or jsPDF');
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

  const components = template?.components || {};
  const student = result.student;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
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
                className="btn btn-sm btn-light"
                onClick={handleDownload}
                title="Download"
              >
                <Download size={16} />
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
              className="bg-white shadow-sm mx-auto" 
              style={{ 
                maxWidth: '210mm', 
                minHeight: '297mm',
                padding: '20mm'
              }}
            >
              {/* School Header */}
              {components.header?.enabled && schoolInfo && (
                <div className="text-center mb-4 pb-3 border-bottom border-2">
                  {schoolInfo.logoUrl && (
                    <img 
                      src={schoolInfo.logoUrl} 
                      alt="School Logo" 
                      style={{ height: '80px', marginBottom: '10px' }}
                    />
                  )}
                  <h3 className="fw-bold mb-1">{schoolInfo.name}</h3>
                  <p className="text-muted mb-1 small">{schoolInfo.address}</p>
                  {schoolInfo.motto && (
                    <p className="fst-italic text-muted small">"{schoolInfo.motto}"</p>
                  )}
                  <h5 className="mt-3 fw-bold text-primary">
                    {result.term} Report Card - {result.session}
                  </h5>
                </div>
              )}

              {/* Student Information */}
              {components.studentInfo?.enabled && (
                <div className="row mb-4">
                  <div className="col-6">
                    <p className="mb-2"><strong>Student Name:</strong> {student.name}</p>
                    <p className="mb-2"><strong>Class:</strong> {result.classId.name}</p>
                  </div>
                  <div className="col-6">
                    <p className="mb-2"><strong>Reg. Number:</strong> {student.regNo}</p>
                    <p className="mb-2"><strong>Session:</strong> {result.session}</p>
                  </div>
                </div>
              )}

              {/* Scores Table */}
              {components.scoresTable?.enabled && result.scores?.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-primary">Academic Performance</h6>
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '30%' }}>Subject</th>
                        {components.scoresTable.columns
                          ?.filter(col => col.enabled)
                          .map((col, idx) => (
                            <th key={idx} className="text-center" style={{ width: '14%' }}>
                              {col.name}
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
                          <td className="fw-semibold">{score.subject}</td>
                          <td className="text-center">{score.ca1 || '-'}</td>
                          <td className="text-center">{score.ca2 || '-'}</td>
                          <td className="text-center">{score.exam || '-'}</td>
                          <td className="text-center fw-bold">{score.total || '-'}</td>
                          <td className="text-center">
                            <span className={`badge bg-${
                              score.grade === 'A' ? 'success' :
                              score.grade === 'B' ? 'primary' :
                              score.grade === 'C' ? 'info' :
                              score.grade === 'D' ? 'warning' : 'danger'
                            }`}>
                              {score.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="table-secondary fw-bold">
                        <td>Overall Total</td>
                        <td colSpan="3" className="text-end">{result.overallTotal}</td>
                        <td className="text-center">{result.overallAverage}%</td>
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
              )}

              {/* Affective Traits */}
              {components.affectiveTraits?.enabled && result.affectiveTraits && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-primary">Affective Traits (Rating: 1-5)</h6>
                  <div className="row">
                    {Object.entries(result.affectiveTraits).map(([trait, rating], idx) => (
                      <div key={idx} className="col-6 col-md-4 mb-2">
                        <div className="d-flex justify-content-between">
                          <span>{trait}:</span>
                          <span className="fw-bold">{rating}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* School Fees */}
              {components.fees?.enabled && result.fees && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-primary">School Fees</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <tbody>
                        {Object.entries(result.fees).map(([feeType, amount], idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{feeType}</td>
                            <td className="text-end">₦{amount?.toLocaleString() || 0}</td>
                          </tr>
                        ))}
                        <tr className="table-secondary fw-bold">
                          <td>Total Fees</td>
                          <td className="text-end">
                            ₦{Object.values(result.fees || {})
                              .reduce((sum, val) => sum + (val || 0), 0)
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
                  <h6 className="fw-bold mb-3 text-primary">Attendance</h6>
                  <div className="row">
                    <div className="col-4">
                      <p className="mb-1"><strong>School Opened:</strong></p>
                      <p className="fs-4 fw-bold text-primary">{result.attendance.opened || 0}</p>
                    </div>
                    <div className="col-4">
                      <p className="mb-1"><strong>Times Present:</strong></p>
                      <p className="fs-4 fw-bold text-success">{result.attendance.present || 0}</p>
                    </div>
                    <div className="col-4">
                      <p className="mb-1"><strong>Times Absent:</strong></p>
                      <p className="fs-4 fw-bold text-danger">{result.attendance.absent || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              {components.comments?.enabled && (
                <div className="mb-4">
                  {components.comments.teacher && result.teacherComment && (
                    <div className="mb-3">
                      <h6 className="fw-bold text-primary">Class Teacher's Comment</h6>
                      <div className="border rounded p-3 bg-light">
                        <p className="mb-0">{result.teacherComment}</p>
                      </div>
                    </div>
                  )}
                  
                  {components.comments.principal && result.principalComment && (
                    <div>
                      <h6 className="fw-bold text-primary">Principal's Comment</h6>
                      <div className="border rounded p-3 bg-light">
                        <p className="mb-0">{result.principalComment}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Signatures */}
              {components.signatures?.enabled && (
                <div className="row mt-5 pt-4">
                  <div className="col-6 text-center">
                    <div className="border-top border-dark pt-2">
                      <small className="fw-semibold">Class Teacher's Signature</small>
                    </div>
                  </div>
                  <div className="col-6 text-center">
                    <div className="border-top border-dark pt-2">
                      <small className="fw-semibold">Principal's Signature</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-4 pt-3 border-top">
                <small className="text-muted">
                  Generated on {new Date().toLocaleDateString()} • 
                  Status: <span className="text-uppercase fw-bold">{result.status}</span>
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
      <style jsx>{`
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
          }
        }
      `}</style>
    </div>
  );
};

export default ResultPreviewModal;