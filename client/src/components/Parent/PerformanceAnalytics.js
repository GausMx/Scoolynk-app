// src/components/Parent/PerformanceAnalytics.js - NEW FILE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import Loading from '../common/Loading';
import { getUser } from '../utils/auth';

const { REACT_APP_API_URL } = process.env;

const PerformanceAnalytics = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const token = localStorage.getItem('accessToken');

  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [analytics, setAnalytics] = useState({
    performanceTrend: [],
    subjectPerformance: [],
    totalResults: 0,
    bestGrade: null,
    latestPosition: null
  });

  useEffect(() => {
    fetchAnalytics();
  }, [studentId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(
        `${REACT_APP_API_URL}/api/parent/children/${studentId}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLoadingPercent(70);
      setAnalytics(res.data);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <Layout user={user} role="parent">
      <div className="container-fluid py-4 px-4" style={{ paddingTop: '140px', maxWidth: '1400px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
              Performance Analytics
            </h4>
            <p className="text-muted mb-0">Track your child's academic progress over time</p>
          </div>
          <button 
            className="btn btn-outline-secondary rounded-3"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>
        </div>

        {/* Summary Stats */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm rounded-4 p-4 bg-primary bg-opacity-10">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-text-fill text-primary me-3" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <small className="text-muted d-block">Total Results</small>
                  <h3 className="fw-bold mb-0">{analytics.totalResults}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm rounded-4 p-4 bg-success bg-opacity-10">
              <div className="d-flex align-items-center">
                <i className="bi bi-trophy-fill text-success me-3" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <small className="text-muted d-block">Best Average</small>
                  <h3 className="fw-bold mb-0">{analytics.bestGrade || 'N/A'}%</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm rounded-4 p-4 bg-warning bg-opacity-10">
              <div className="d-flex align-items-center">
                <i className="bi bi-award-fill text-warning me-3" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <small className="text-muted d-block">Latest Position</small>
                  <h3 className="fw-bold mb-0">
                    {analytics.latestPosition ? `${analytics.latestPosition}${
                      analytics.latestPosition === 1 ? 'st' :
                      analytics.latestPosition === 2 ? 'nd' :
                      analytics.latestPosition === 3 ? 'rd' : 'th'
                    }` : 'N/A'}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        {analytics.performanceTrend.length > 0 && (
          <div className="card shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-graph-up me-2 text-primary"></i>
              Performance Trend
            </h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Term</th>
                    <th>Session</th>
                    <th className="text-center">Average</th>
                    <th className="text-center">Grade</th>
                    <th className="text-center">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.performanceTrend.map((trend, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{trend.term}</td>
                      <td>{trend.session}</td>
                      <td className="text-center">
                        <span className="fw-bold">{trend.average}%</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${
                          trend.grade === 'A' ? 'success' :
                          trend.grade === 'B' ? 'primary' :
                          trend.grade === 'C' ? 'info' :
                          trend.grade === 'D' ? 'warning' : 'danger'
                        }`}>
                          {trend.grade}
                        </span>
                      </td>
                      <td className="text-center fw-bold">
                        {trend.position ? `${trend.position}${
                          trend.position === 1 ? 'st' :
                          trend.position === 2 ? 'nd' :
                          trend.position === 3 ? 'rd' : 'th'
                        }` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subject Performance */}
        {analytics.subjectPerformance.length > 0 && (
          <div className="card shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-bar-chart-fill me-2 text-success"></i>
              Average Performance by Subject
            </h5>
            <div className="row g-3">
              {analytics.subjectPerformance.map((subject, idx) => (
                <div key={idx} className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 bg-light p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold">{subject.subject}</span>
                      <span className={`badge bg-${
                        subject.averageGrade === 'A' ? 'success' :
                        subject.averageGrade === 'B' ? 'primary' :
                        subject.averageGrade === 'C' ? 'info' :
                        subject.averageGrade === 'D' ? 'warning' : 'danger'
                      }`}>
                        {subject.averageGrade}
                      </span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className={`progress-bar bg-${
                          subject.averageScore >= 70 ? 'success' :
                          subject.averageScore >= 60 ? 'primary' :
                          subject.averageScore >= 50 ? 'info' :
                          subject.averageScore >= 40 ? 'warning' : 'danger'
                        }`}
                        style={{ width: `${subject.averageScore}%` }}
                      ></div>
                    </div>
                    <small className="text-muted mt-2">
                      Average: {subject.averageScore}/100
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {analytics.performanceTrend.length === 0 && analytics.subjectPerformance.length === 0 && (
          <div className="alert alert-info rounded-3">
            <i className="bi bi-info-circle me-2"></i>
            No performance data available yet. Results will appear here once they are published.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PerformanceAnalytics;