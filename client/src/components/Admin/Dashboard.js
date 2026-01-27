import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Loading from '../common/Loading'

const { REACT_APP_API_URL } = process.env;

const StatCard = ({ title, value, iconClass, bgClass, textClass, onClick }) => (
  <div className="col-12 col-sm-6 col-lg-4">
    <div
      className={`card shadow-sm rounded-4 p-3 ${bgClass} hover:shadow-lg transition`}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h6 className={`fw-bold mb-1 ${textClass}`} style={{ fontSize: '0.85rem' }}>{title}</h6>
          <p className="fs-3 fw-bold text-dark mb-0">{value}</p>
        </div>
        <i className={`${iconClass} ${textClass}`} style={{ fontSize: '2.5rem' }}></i>
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
    pendingResults: 0,
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

      setStats({
        totalStudents: data.totalStudents || 0,
        totalTeachers: data.totalTeachers || 0,
        totalClasses: data.totalClasses || 0,
        pendingResults: data.pendingResults || 0,
      });

      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        pendingResults: 0,
      });
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4 px-4" style={{ paddingTop: '140px', maxWidth: '1400px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Dashboard</h2>
          <p className="text-muted mb-0">Overview of your school</p>
        </div>
        <button 
          className="btn btn-outline-primary rounded-3" 
          onClick={() => window.location.reload()}
        >
          <i className="bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Alert for Pending Results */}
      {stats.pendingResults > 0 && (
        <div className="alert alert-warning rounded-4 mb-4 d-flex align-items-center">
          <i className="bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
          <div className="flex-grow-1">
            <strong>Action Required:</strong> You have {stats.pendingResults} result(s) pending review.
          </div>
          <button
            className="btn btn-warning ms-3"
            onClick={() => navigate('/admin/result-management')}
          >
            Review Now
          </button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="row g-4 mb-4">
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

      {/* Quick Actions */}
      <div className="card shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-4">
          <i className="bi-lightning-fill me-2 text-warning"></i> Quick Actions
        </h5>
        <div className="row g-3">
          {/* Mobile: 2 columns (col-6), Tablet: 2 columns (col-md-6), PC: 3 columns (col-lg-3) */}
          <div className="col-6 col-md-6 col-lg-3">
            <button
              className="btn btn-outline-primary w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/result-management')}
            >
              <i className="bi-file-earmark-check d-block mb-2" style={{ fontSize: '2rem' }}></i>
              <span className="fw-semibold">View Results</span>
            </button>
          </div>
          <div className="col-6 col-md-6 col-lg-3">
            <button
              className="btn btn-outline-info w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/manage-courses')}
            >
              <i className="bi-book d-block mb-2" style={{ fontSize: '2rem' }}></i>
              <span className="fw-semibold">Manage Courses</span>
            </button>
          </div>
          <div className="col-6 col-md-6 col-lg-3">
            <button
              className="btn btn-outline-secondary w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/settings')}
            >
              <i className="bi-gear-fill d-block mb-2" style={{ fontSize: '2rem' }}></i>
              <span className="fw-semibold">Settings</span>
            </button>
          </div>
          <div className="col-6 col-md-6 col-lg-3">
            <button
              className="btn btn-outline-warning w-100 rounded-3 py-3"
              onClick={() => navigate('/admin/template-builder')}
            >
              <i className="bi-file-earmark-text d-block mb-2" style={{ fontSize: '2rem' }}></i>
              <span className="fw-semibold">Template Builder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;