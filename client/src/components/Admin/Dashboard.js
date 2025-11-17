import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'chart.js/auto';
import Loading from '../common/Loading' // Import the new Loading component

const { REACT_APP_API_URL } = process.env;

const StatCard = ({ title, value, iconClass, bgClass, textClass, onClick }) => (
  <div className="col-12 col-md-6 col-lg-4">
    <div
      className={`card shadow-sm rounded-4 p-3 ${bgClass} hover:shadow-lg transition`}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h6 className={`fw-bold mb-1 ${textClass} small`}>{title}</h6>
          <p className="fs-4 fw-bold text-dark mb-0">{value}</p>
        </div>
        <i className={`${iconClass} fs-2 ${textClass}`}></i>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0); // You can update this if you want dynamic percentage
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeStudents: 0,
    unpaidFees: 0,
    partialPaid: 0,
    fullPaid: 0,
    pendingResults: 0,
    approvedResults: 0,
    rejectedResults: 0,
    feesTrend: [],
    resultsTrend: [],
    recentActivity: []
  });

  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchDashboardData();
  }, []);
    
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(`${REACT_APP_API_URL}/api/admin`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setLoadingPercent(70);

      const data = res.data;

      setStats({
        totalStudents: data.totalStudents || 0,
        totalTeachers: data.totalTeachers || 0,
        totalClasses: data.totalClasses || 0,
        activeStudents: data.activeStudents || 0,
        unpaidFees: data.unpaidFeesAmount || 0,
        partialPaid: data.partialPaidCount || 0,
        fullPaid: data.fullPaidCount || 0,
        pendingResults: data.pendingResults || 0,
        approvedResults: data.approvedResults || 0,
        rejectedResults: data.rejectedResults || 0,
        feesTrend: data.feesTrend || [0, 0, 0, 0, 0, 0],
        resultsTrend: data.resultsTrend || [0, 0, 0, 0, 0, 0],
        recentActivity: data.recentActivity || [],
      });

      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeStudents: 0,
        unpaidFees: 0,
        partialPaid: 0,
        fullPaid: 0,
        pendingResults: 0,
        approvedResults: 0,
        rejectedResults: 0,
        feesTrend: [0, 0, 0, 0, 0, 0],
        resultsTrend: [0, 0, 0, 0, 0, 0],
        recentActivity: [],
      });
      setLoadingPercent(100);
    } finally {
      setLoading(false);
    }
  };

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
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
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Pending Results',
        data: stats.resultsTrend,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-4 fs-md-3">School Admin Dashboard</h2>
          <p className="text-muted mb-0 small">Welcome back! Here's what's happening in your school.</p>
        </div>
        <button className="btn btn-outline-primary rounded-3 w-100 w-md-auto" onClick={() => window.location.reload()}>
          <i className="bi-arrow-clockwise me-2"></i>
          <span className="small">Refresh</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          iconClass="bi-people-fill"
          bgClass="bg-primary bg-opacity-10"
          textClass="text-primary"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          iconClass="bi-person-badge-fill"
          bgClass="bg-success bg-opacity-10"
          textClass="text-success"
          onClick={() => navigate('/admin/teachers')}
        />
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          iconClass="bi-door-open-fill"
          bgClass="bg-info bg-opacity-10"
          textClass="text-info"
          onClick={() => navigate('/admin/classes')}
        />
      </div>

      {/* Payments */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4 p-3 p-md-4">
            <h5 className="fw-bold mb-3 mb-md-4 fs-6 fs-md-5">
              <i className="bi-cash-stack me-2 text-success"></i> Payment Overview
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="border-start border-success border-4 ps-3">
                  <small className="text-muted d-block mb-1">Fully Paid</small>
                  <h4 className="fw-bold text-success mb-0 fs-5 fs-md-4">{stats.fullPaid}</h4>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="border-start border-warning border-4 ps-3">
                  <small className="text-muted d-block mb-1">Partial Payment</small>
                  <h4 className="fw-bold text-warning mb-0 fs-5 fs-md-4">{stats.partialPaid}</h4>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="border-start border-danger border-4 ps-3">
                  <small className="text-muted d-block mb-1">Outstanding Fees</small>
                  <h4 className="fw-bold text-danger mb-0 fs-5 fs-md-4">₦{stats.unpaidFees.toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4 p-3 p-md-4">
            <h5 className="fw-bold mb-3 mb-md-4 fs-6 fs-md-5">
              <i className="bi-file-earmark-text me-2 text-primary"></i> Results Overview
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="border-start border-warning border-4 ps-3">
                  <small className="text-muted d-block mb-1">Pending Review</small>
                  <h4 className="fw-bold text-warning mb-0 fs-5 fs-md-4">{stats.pendingResults}</h4>
                  <button
                    className="btn btn-sm btn-warning mt-2 w-100 w-md-auto"
                    onClick={() => navigate('/admin/result-management')}
                  >
                    Review Now
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="border-start border-success border-4 ps-3">
                  <small className="text-muted d-block mb-1">Approved</small>
                  <h4 className="fw-bold text-success mb-0 fs-5 fs-md-4">{stats.approvedResults}</h4>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="border-start border-danger border-4 ps-3">
                  <small className="text-muted d-block mb-1">Rejected</small>
                  <h4 className="fw-bold text-danger mb-0 fs-5 fs-md-4">{stats.rejectedResults}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm rounded-4 p-3 p-md-4">
            <h6 className="fw-bold mb-3 small">
              <i className="bi-graph-up me-2 text-success"></i> Fees Collection Trend
            </h6>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm rounded-4 p-3 p-md-4">
            <h6 className="fw-bold mb-3 small">
              <i className="bi-graph-up-arrow me-2 text-danger"></i> Results Submission Trend
            </h6>
            <Line data={sparklineData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card shadow-sm rounded-4 p-3 p-md-4 mb-3 mb-md-4">
        <h5 className="fw-bold mb-3 fs-6 fs-md-5">
          <i className="bi-lightning-fill me-2 text-warning"></i> Quick Actions
        </h5>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-primary w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/result-management')}
            >
              <i className="bi-file-earmark-check fs-4 d-block mb-2"></i>
              <span className="fw-semibold small">View Results</span>
            </button>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-success w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/settings')}
            >
              <i className="bi-cash-stack fs-4 d-block mb-2"></i>
              <span className="fw-semibold small">Settings</span>
            </button>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-info w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/manage-students')}
            >
              <i className="bi-people fs-4 d-block mb-2"></i>
              <span className="fw-semibold small">Manage Students</span>
            </button>
          </div>
          <div className="col-6 col-md-3">
            <button
              className="btn btn-outline-warning w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/manage-teachers')}
            >
              <i className="bi-person-badge fs-4 d-block mb-2"></i>
              <span className="fw-semibold small">Manage Teachers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {stats.pendingResults > 0 && (
        <div className="alert alert-warning rounded-4">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
            <i className="bi-exclamation-triangle-fill fs-4"></i>
            <div className="flex-grow-1">
              <h6 className="mb-1 small">Action Required!</h6>
              <p className="mb-0 small">
                You have <strong>{stats.pendingResults}</strong> result(s) waiting for review.
              </p>
            </div>
            <button
              className="btn btn-warning w-100 w-md-auto"
              onClick={() => navigate('/admin/result-management')}
            >
              Review Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;