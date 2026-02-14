// src/components/Parent/ResultDetails.js - NEW FILE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import Loading from '../common/Loading';
import { getUser } from '../utils/auth';

const { REACT_APP_API_URL } = process.env;

const ResultDetails = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const token = localStorage.getItem('accessToken');

  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchResultDetails();
  }, [resultId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(
        `${REACT_APP_API_URL}/api/parent/results/${resultId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLoadingPercent(70);
      setResult(res.data.result);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch result details:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleDownloadPDF = () => {
    const downloadUrl = `${REACT_APP_API_URL}/api/results/download/${resultId}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  if (!result) {
    return (
      <Layout user={user} role="parent">
        <div className="container py-5">
          <div className="alert alert-danger">Result not found.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} role="parent">
      <div className="container-fluid py-4 px-4" style={{ paddingTop: '140px', maxWidth: '1200px' }}>
        {/* Header */}
        <div className="card shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h4 className="fw-bold mb-2">
                <i className="bi bi-file-earmark-text-fill me-2 text-primary"></i>
                Result Details
              </h4>
              <p className="text-muted mb-0">
                {result.student.name} • {result.classId.name} • {result.term}, {result.session}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-success rounded-3"
                onClick={handleDownloadPDF}
              >
                <i className="bi bi-download me-2"></i>
                Download PDF
              </button>
              <button 
                className="btn btn-outline-secondary rounded-3"
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="card shadow-sm rounded-4 p-4 mb-4 bg-light">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <strong className="d-block text-muted small mb-1">Student Name</strong>
              <span className="fw-bold">{result.student.name}</span>
            </div>
            <div className="col-12 col-md-6">
              <strong className="d-block text-muted small mb-1">Registration Number</strong>
              <span className="fw-bold">{result.student.regNo}</span>
            </div>
            <div className="col-12 col-md-4">
              <strong className="d-block text-muted small mb-1">Class</strong>
              <span className="badge bg-info">{result.classId.name}</span>
            </div>
            <div className="col-12 col-md-4">
              <strong className="d-block text-muted small mb-1">Term</strong>
              <span>{result.term}</span>
            </div>
            <div className="col-12 col-md-4">
              <strong className="d-block text-muted small mb-1">Session</strong>
              <span>{result.session}</span>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="card shadow-sm rounded-4 p-4 mb-4 border-start border-primary border-4">
          <h5 className="fw-bold mb-4">
            <i className="bi bi-trophy-fill me-2 text-warning"></i>
            Overall Performance
          </h5>
          <div className="row g-4">
            <div className="col-12 col-md-3">
              <div className="text-center p-3 bg-primary bg-opacity-10 rounded-3">
                <small className="text-muted d-block mb-2">Total Score</small>
                <h3 className="fw-bold mb-0 text-primary">{result.overallTotal}</h3>
                <small className="text-muted">out of {result.subjects.length * 100}</small>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
                <small className="text-muted d-block mb-2">Average</small>
                <h3 className="fw-bold mb-0 text-success">{result.overallAverage}%</h3>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="text-center p-3 bg-info bg-opacity-10 rounded-3">
                <small className="text-muted d-block mb-2">Grade</small>
                <h3 className="fw-bold mb-0">
                  <span className={`badge bg-${
                    result.overallGrade === 'A' ? 'success' :
                    result.overallGrade === 'B' ? 'primary' :
                    result.overallGrade === 'C' ? 'info' :
                    result.overallGrade === 'D' ? 'warning' : 'danger'
                  } p-2`} style={{ fontSize: '1.5rem' }}>
                    {result.overallGrade}
                  </span>
                </h3>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="text-center p-3 bg-warning bg-opacity-10 rounded-3">
                <small className="text-muted d-block mb-2">Position</small>
                <h3 className="fw-bold mb-0 text-warning">
                  {result.overallPosition ? `${result.overallPosition}${
                    result.overallPosition === 1 ? 'st' :
                    result.overallPosition === 2 ? 'nd' :
                    result.overallPosition === 3 ? 'rd' : 'th'
                  }` : 'N/A'}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Scores */}
        <div className="card shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-4">
            <i className="bi bi-book-fill me-2 text-primary"></i>
            Subject Performance
          </h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Subject</th>
                  <th className="text-center">CA1 (20)</th>
                  <th className="text-center">CA2 (20)</th>
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
                      <td className="fw-semibold">{subject.subject}</td>
                      <td className="text-center">{subject.ca1}</td>
                      <td className="text-center">{subject.ca2}</td>
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
                    <td colSpan="7" className="text-center text-muted">No subjects recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affective Traits */}
        {result.affectiveTraits && (
          <div className="card shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-heart-fill me-2 text-danger"></i>
              Affective Traits
            </h5>
            <div className="row g-3">
              {Object.entries(result.affectiveTraits).map(([trait, value]) => (
                <div key={trait} className="col-12 col-md-6 col-lg-4">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                    <span className="fw-semibold text-capitalize">{trait}</span>
                    <div className="d-flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i 
                          key={star}
                          className={`bi bi-star${star <= value ? '-fill text-warning' : ' text-secondary'}`}
                        ></i>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance */}
        {result.attendance && (
          <div className="card shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-calendar-check-fill me-2 text-success"></i>
              Attendance
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="text-center p-3 bg-info bg-opacity-10 rounded-3">
                  <small className="text-muted d-block mb-2">Days Opened</small>
                  <h4 className="fw-bold mb-0 text-info">{result.attendance.opened}</h4>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
                  <small className="text-muted d-block mb-2">Days Present</small>
                  <h4 className="fw-bold mb-0 text-success">{result.attendance.present}</h4>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="text-center p-3 bg-danger bg-opacity-10 rounded-3">
                  <small className="text-muted d-block mb-2">Days Absent</small>
                  <h4 className="fw-bold mb-0 text-danger">{result.attendance.absent}</h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        {(result.comments?.teacher || result.comments?.principal) && (
          <div className="card shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-chat-left-quote-fill me-2 text-primary"></i>
              Comments
            </h5>
            {result.comments.teacher && (
              <div className="mb-3">
                <strong className="d-block text-muted small mb-2">
                  <i className="bi bi-person-fill me-1"></i>
                  Class Teacher's Comment
                </strong>
                <p className="mb-0 p-3 bg-light rounded-3">{result.comments.teacher}</p>
              </div>
            )}
            {result.comments.principal && (
              <div>
                <strong className="d-block text-muted small mb-2">
                  <i className="bi bi-person-badge-fill me-1"></i>
                  Principal's Comment
                </strong>
                <p className="mb-0 p-3 bg-light rounded-3">{result.comments.principal}</p>
              </div>
            )}
          </div>
        )}

        {/* Download Again Button */}
        <div className="text-center">
          <button 
            className="btn btn-lg btn-success rounded-pill px-5"
            onClick={handleDownloadPDF}
          >
            <i className="bi bi-download me-2"></i>
            Download Full Result PDF
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ResultDetails;