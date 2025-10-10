import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'chart.js/auto';

const MOCK_STATS = {
  totalUsers: 1250,
  activeStudents: 1000,
  unpaidFees: 25000,
  pendingApprovals: 5,
  enrollmentTrend: [50, 60, 80, 90, 100, 120],
  feesTrend: [5000, 8000, 12000, 15000, 20000, 25000],
  approvalsTrend: [0, 1, 2, 2, 3, 5],
};

// Mock recent activity data
const MOCK_RECENT_ACTIVITY = [
  { type: 'Student Registered', name: 'Giyasat Lawal', date: '2025-10-08', status: 'Completed' },
  { type: 'Parent Registered', name: 'Nurein Lawal', date: '2025-10-07', status: 'Completed' },
  { type: 'Fee Payment', name: 'JSS1A - Giyasat Lawal', date: '2025-10-06', status: 'Pending' },
  { type: 'Student Registered', name: 'Aisha Bello', date: '2025-10-06', status: 'Completed' },
];

const StatCard = ({ title, value, iconClass, bgClass, textClass }) => (
  <div className="col-12 col-md-6 col-lg-3">
    <div className={`card shadow-sm rounded-4 p-3 ${bgClass} hover:shadow-lg transition`} style={{ cursor: 'pointer' }}>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h6 className={`fw-bold mb-1 ${textClass}`}>{title}</h6>
          <p className="fs-4 fw-bold text-dark mb-0">{value}</p>
        </div>
        <i className={`${iconClass} fs-2 ${textClass}`}></i>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(MOCK_STATS);
  const [activities, setActivities] = useState(MOCK_RECENT_ACTIVITY);

  useEffect(() => {
    // Replace with backend API fetch
    // fetch('/api/admin/dashboard').then(...).then(setStats)
    // fetch('/api/admin/recent-activity').then(...).then(setActivities)
  }, []);

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Student Enrollment',
        data: stats.enrollmentTrend,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Fees Collected',
        data: stats.feesTrend,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  const sparklineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Pending Approvals',
        data: stats.approvalsTrend,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold mb-4 text-dark">School Admin Dashboard</h2>

      {/* Top Stats Cards */}
      <div className="row g-4 mb-4">
        <StatCard title="Total Users" value={stats.totalUsers} iconClass="bi-people-fill" bgClass="bg-primary bg-opacity-10" textClass="text-primary" />
        <StatCard title="Active Students" value={stats.activeStudents} iconClass="bi-journal-check" bgClass="bg-info bg-opacity-10" textClass="text-info" />
        <StatCard title="Unpaid Fees" value={`₦${stats.unpaidFees}`} iconClass="bi-currency-dollar" bgClass="bg-success bg-opacity-10" textClass="text-success" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} iconClass="bi-clock-fill" bgClass="bg-danger bg-opacity-10" textClass="text-danger" />
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">Student Enrollment Trend</h6>
            <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">Fees Collection Trend</h6>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* Sparkline Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-12">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">Pending Approvals Over Time</h6>
            <Line data={sparklineData} options={{ responsive: true, plugins: { legend: { display: false } }, elements: { point: { radius: 3 } } }} />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="row g-4 mb-4">
        <div className="col-lg-12">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">Recent Activity</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Name</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, i) => (
                    <tr key={i}>
                      <td>{activity.type}</td>
                      <td>{activity.name}</td>
                      <td>{activity.date}</td>
                      <td>
                        <span className={`badge ${activity.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3 mt-4">
        {['Add Student', 'Add Parent', 'Broadcast', 'View Results'].map((action, i) => (
          <div className="col-6 col-md-3" key={i}>
            <button className="btn btn-outline-primary w-100 rounded-4 py-3 fw-semibold">{action}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
