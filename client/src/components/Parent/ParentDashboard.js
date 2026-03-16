// src/components/Parent/ParentDashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import Loading from '../common/Loading';
import { getUser } from '../utils/auth';

const { REACT_APP_API_URL } = process.env;

const ParentDashboard = () => {
  const navigate = useNavigate();
  const user  = getUser();
  const token = localStorage.getItem('accessToken');

  const [loading,        setLoading]        = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [dashboardData,  setDashboardData]  = useState({
    school: {}, children: [], totalChildren: 0,
    totalResults: 0, avgPerformance: 0, recentResults: [], notifications: []
  });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);
      const res = await axios.get(`${REACT_APP_API_URL}/api/parent/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoadingPercent(70);
      setDashboardData(res.data);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  if (loading) return <Loading percentage={loadingPercent} />;

  return (
    <Layout user={user} role="parent">
      <div className="container-fluid py-4 px-4" style={{ paddingTop: '140px', maxWidth: '1400px' }}>

        {/* Welcome Header */}
        <div className="mb-4">
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-house-heart-fill me-2 text-primary"></i>
            Welcome, {user?.name}
          </h2>
          <p className="text-muted mb-0">{dashboardData.school?.name || 'Parent Dashboard'}</p>
        </div>

        {/* Notifications */}
        {dashboardData.notifications.length > 0 && (
          <div className="alert alert-info rounded-4 mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-bell-fill me-3" style={{ fontSize: '1.5rem' }}></i>
              <div className="flex-grow-1">
                <strong className="d-block mb-2">New Notifications</strong>
                {dashboardData.notifications.slice(0, 3).map((notif, idx) => (
                  <div key={idx} className="mb-1"><i className="bi bi-dot"></i> {notif.message}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-primary bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-primary small">My Children</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.totalChildren}</p>
                </div>
                <i className="bi bi-people-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-success bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-success small">Total Results</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.totalResults}</p>
                </div>
                <i className="bi bi-file-earmark-text-fill text-success" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-info bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-info small">Avg Performance</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.avgPerformance}%</p>
                </div>
                <i className="bi bi-graph-up-arrow text-info" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-warning bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-warning small">New Results</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.notifications.length}</p>
                </div>
                <i className="bi bi-bell-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Children Cards */}
        <div className="card shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-4">
            <i className="bi bi-person-hearts me-2 text-primary"></i>
            My Children
          </h5>

          {dashboardData.children.length === 0 ? (
            <div className="alert alert-info rounded-3">
              <i className="bi bi-info-circle me-2"></i>
              No children linked to your account. Please contact the school admin.
            </div>
          ) : (
            <div className="row g-3">
              {dashboardData.children.map(child => (
                <div key={child._id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="card border-0 shadow-sm rounded-3 h-100"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/parent/children/${child._id}/results`)}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center mb-3">
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                          style={{ width: '50px', height: '50px' }}
                        >
                          <i className="bi bi-person-fill text-primary" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-0">{child.name}</h6>
                          <small className="text-muted">{child.regNo}</small>
                        </div>
                      </div>

                      <div className="mb-2">
                        <span className="badge bg-info me-2">{child.classId?.name || 'N/A'}</span>
                        <span className="badge bg-secondary">{child.status}</span>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3 flex-grow-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/parent/children/${child._id}/results`);
                          }}
                        >
                          <i className="bi bi-file-earmark-text me-1"></i>Results
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success rounded-3 flex-grow-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/parent/children/${child._id}/analytics`);
                          }}
                        >
                          <i className="bi bi-graph-up me-1"></i>Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        {dashboardData.recentResults.length > 0 && (
          <div className="card shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-clock-history me-2 text-success"></i>
              Recent Results
            </h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small">Student</th>
                    <th className="small">Class</th>
                    <th className="small">Term/Session</th>
                    <th className="small">Average</th>
                    <th className="small">Grade</th>
                    <th className="small text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentResults.map(result => (
                    <tr key={result._id}>
                      <td>
                        <div className="fw-semibold small">{result.student.name}</div>
                        <small className="text-muted">{result.student.regNo}</small>
                      </td>
                      <td><span className="badge bg-info">{result.classId.name}</span></td>
                      <td className="small">
                        {result.term}<br />
                        <small className="text-muted">{result.session}</small>
                      </td>
                      <td className="fw-bold">{result.overallAverage}%</td>
                      <td>
                        <span className={`badge bg-${
                          result.overallGrade === 'A' ? 'success' :
                          result.overallGrade === 'B' ? 'primary' :
                          result.overallGrade === 'C' ? 'info'    :
                          result.overallGrade === 'D' ? 'warning' : 'danger'
                        }`}>{result.overallGrade}</span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/parent/results/${result._id}`)}
                        >
                          <i className="bi bi-eye me-1"></i>View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ParentDashboard;