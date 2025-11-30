import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'chart.js/auto';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const StatCard = ({ title, value, iconClass, bgClass, textClass, onClick }) => (
  <div className="col-12 col-sm-6 col-lg-4">
    <div
      className={`card shadow-sm rounded-4 p-2 p-sm-3 ${bgClass} hover:shadow-lg transition`}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h6 className={`fw-bold mb-1 ${textClass}`} style={{ fontSize: '0.75rem' }}>{title}</h6>
          <p className="fs-4 fw-bold text-dark mb-0" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>{value}</p>
        </div>
        <i className={`${iconClass} ${textClass}`} style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}></i>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeStudents: 0,
    unpaidFeesAmount: 0,
    partialPaid: 0,
    fullPaid: 0,
    pendingResults: 0,
    approvedResults: 0,
    rejectedResults: 0,
    feesTrend: [],
    resultsTrend: [],
    monthLabels: [], // ✅ Dynamic month labels from backend
    recentActivity: []
  });

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(`${REACT_APP_API_URL}/api/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLoadingPercent(70);

      const data = res.data;

      console.log('Dashboard API Response:', data);
      console.log('Month Labels from Backend:', data.monthLabels);
      console.log('Results Trend from Backend:', data.resultsTrend);

      setStats({
        totalStudents: data.totalStudents || 0,
        totalTeachers: data.totalTeachers || 0,
        totalClasses: data.totalClasses || 0,
        activeStudents: data.activeStudents || 0,
        unpaidFeesAmount: data.unpaidFeesAmount || 0,
        partialPaid: data.partialPaid || 0,
        fullPaid: data.fullPaid || 0,
        pendingResults: data.pendingResults || 0,
        approvedResults: data.approvedResults || 0,
        rejectedResults: data.rejectedResults || 0,
        feesTrend: data.feesTrend || [0, 0, 0, 0, 0, 0],
        resultsTrend: data.resultsTrend || [0, 0, 0, 0, 0, 0],
        monthLabels: data.monthLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // ✅ Dynamic labels
        recentActivity: data.recentActivity || [],
      });

      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      console.error('Error details:', err.response?.data);
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeStudents: 0,
        unpaidFeesAmount: 0,
        partialPaid: 0,
        fullPaid: 0,
        pendingResults: 0,
        approvedResults: 0,
        rejectedResults: 0,
        feesTrend: [0, 0, 0, 0, 0, 0],
        resultsTrend: [0, 0, 0, 0, 0, 0],
        monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // ✅ Fallback
        recentActivity: [],
      });
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const barData = {
    labels: stats.monthLabels, // ✅ Dynamic labels
    datasets: [
      {
        label: 'Fees Collected (₦)',
        data: stats.feesTrend,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const sparklineData = {
    labels: stats.monthLabels, // ✅ Dynamic labels from backend
    datasets: [
      {
        label: 'Results Submitted',
        data: stats.resultsTrend,
        borderColor: 'rgba(54, 162, 235, 1)', // Blue
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ paddingTop: '140px', maxWidth: '100vw', overflowX: 'hidden' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2 gap-md-3">
        <div className="w-100 w-md-auto">
          <h2 className="fw-bold text-dark mb-1 fs-5 fs-md-4 fs-lg-3">School Admin Dashboard</h2>
          <p className="text-muted mb-0 small">Welcome back! Here's what's happening in your school.</p>
        </div>
        <button className="btn btn-outline-primary rounded-3 w-100 w-md-auto" onClick={() => window.location.reload()}>
          <i className="bi-arrow-clockwise me-2"></i>
          <span className="small">Refresh</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          iconClass="bi-people-fill"
          bgClass="bg-primary bg-opacity-10"
          textClass="text-primary"
          onClick={() => navigate('/admin/manage-students')}
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          iconClass="bi-person-badge-fill"
          bgClass="bg-success bg-opacity-10"
          textClass="text-success"
          onClick={() => navigate('/admin/manage-teachers')}
        />
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          iconClass="bi-door-open-fill"
          bgClass="bg-info bg-opacity-10"
          textClass="text-info"
          onClick={() => navigate('/admin/manage-classes')}
        />
      </div>

      {/* Results Overview */}
      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4 p-2 p-sm-3 p-md-4">
            <h5 className="fw-bold mb-2 mb-md-3 mb-lg-4 fs-6 fs-md-5">
              <i className="bi-file-earmark-text me-2 text-primary"></i> Results Overview
            </h5>
            <div className="row g-2 g-md-3">
              <div className="col-12 col-md-4">
                <div className="border-start border-warning border-4 ps-2 ps-md-3">
                  <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>Pending Review</small>
                  <h4 className="fw-bold text-warning mb-0" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>{stats.pendingResults}</h4>
                  <button
                    className="btn btn-sm btn-warning mt-2 w-100"
                    onClick={() => navigate('/admin/result-management')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Review Now
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="border-start border-success border-4 ps-2 ps-md-3">
                  <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>Approved</small>
                  <h4 className="fw-bold text-success mb-0" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>{stats.approvedResults}</h4>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="border-start border-danger border-4 ps-2 ps-md-3">
                  <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>Rejected</small>
                  <h4 className="fw-bold text-danger mb-0" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>{stats.rejectedResults}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        {/* Results Submission Trend - Full Width */}
        <div className="col-12">
          <div className="card shadow-sm rounded-4 p-2 p-sm-3 p-md-4">
            <h6 className="fw-bold mb-2 mb-md-3" style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
              <i className="bi-graph-up-arrow me-2 text-primary"></i> Results Submission Trend (Last 6 Months)
            </h6>
            <div className="mb-2">
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                Shows the number of results submitted each month
              </small>
            </div>
            <div style={{ position: 'relative', height: '250px', width: '100%' }}>
              <Line
                data={sparklineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: {
                          size: window.innerWidth < 768 ? 10 : 12,
                        },
                        boxWidth: window.innerWidth < 768 ? 10 : 15,
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `Submitted: ${context.parsed.y} result(s)`;
                        },
                      },
                      titleFont: {
                        size: window.innerWidth < 768 ? 11 : 13,
                      },
                      bodyFont: {
                        size: window.innerWidth < 768 ? 10 : 12,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        precision: 0,
                        font: {
                          size: window.innerWidth < 768 ? 9 : 11,
                        },
                      },
                      title: {
                        display: window.innerWidth >= 768,
                        text: 'Number of Results',
                        font: {
                          size: 11,
                        },
                      },
                    },
                    x: {
                      ticks: {
                        font: {
                          size: window.innerWidth < 768 ? 9 : 11,
                        },
                      },
                      title: {
                        display: window.innerWidth >= 768,
                        text: 'Month',
                        font: {
                          size: 11,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card shadow-sm rounded-4 p-2 p-sm-3 p-md-4 mb-3 mb-md-4">
        <h5 className="fw-bold mb-2 mb-md-3 fs-6 fs-md-5">
          <i className="bi-lightning-fill me-2 text-warning"></i> Quick Actions
        </h5>
        <div className="row g-2 g-md-3">
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-primary w-100 rounded-3 py-2 py-md-3"
              onClick={() => navigate('/admin/result-management')}
              style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}
            >
              <i className="bi-file-earmark-check d-block mb-1 mb-md-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}></i>
              <span className="fw-semibold">View Results</span>
            </button>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-success w-100 rounded-3 py-2 py-md-3"
              onClick={() => navigate('/admin/settings')}
              style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}
            >
              <i className="bi-gear-fill d-block mb-1 mb-md-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}></i>
              <span className="fw-semibold">Settings</span>
            </button>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-info w-100 rounded-3 py-2 py-md-3"
              onClick={() => navigate('/admin/manage-students')}
              style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}
            >
              <i className="bi-people d-block mb-1 mb-md-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}></i>
              <span className="fw-semibold">Manage Students</span>
            </button>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-warning w-100 rounded-3 py-2 py-md-3"
              onClick={() => navigate('/admin/manage-teachers')}
              style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}
            >
              <i className="bi-person-badge d-block mb-1 mb-md-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}></i>
              <span className="fw-semibold">Manage Teachers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {stats.pendingResults > 0 && (
        <div className="alert alert-warning rounded-4 mb-4" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3">
            <i className="bi-exclamation-triangle-fill" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}></i>
            <div className="flex-grow-1">
              <h6 className="mb-1" style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>Action Required!</h6>
              <p className="mb-0" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                You have <strong>{stats.pendingResults}</strong> result(s) waiting for review.
              </p>
            </div>
            <button
              className="btn btn-warning w-100 w-md-auto"
              onClick={() => navigate('/admin/result-management')}
              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
            >
              Review Now
            </button>
          </div>
        </div>
      )}
      <style>
        {`
          /* Prevent horizontal overflow on small devices */
          @media (max-width: 767.98px) {
            body, html, #root {
              overflow-x: hidden !important;
            }
            .container-fluid {
              padding-left: 1rem !important;
              padding-right: 1rem !important;
              padding-top: 140px !important; /* Increased top padding on mobile */
            }

            /* Fix mobile navbar height and show hamburger toggler */
            nav.navbar {
              flex-wrap: nowrap !important;
              height: 56px; /* typical mobile navbar height */
              overflow: visible; /* allow toggler visibility */
              position: relative;
            }
            nav.navbar .navbar-toggler {
              display: block; /* show toggler */
              z-index: 1051; /* above navbar-collapse */
            }
            nav.navbar .navbar-collapse {
              max-height: none; /* remove max-height limit */
              overflow: visible;
            }
            nav.navbar .navbar-nav {
              flex-direction: row;
              flex-wrap: nowrap;
            }
            nav.navbar .nav-link {
              white-space: nowrap;
              padding-left: 0.5rem;
              padding-right: 0.5rem;
            }
          }
          /* Ensure cards and buttons do not overflow */
          .card, button.btn {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;