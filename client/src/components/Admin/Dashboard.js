import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'chart.js/auto';

const MOCK_STATS = {
  activeStudents: 1000,
  unpaidFees: 25000,
  pendingApprovals: 5,
  feesTrend: [5000, 8000, 12000, 15000, 20000, 25000],
  approvalsTrend: [0, 1, 2, 2, 3, 5],
};

const StatCard = ({ title, value, iconClass, bgClass, textClass }) => (
  <div className="col-12 col-md-4">
    <div
      className={`card shadow-sm rounded-4 p-3 ${bgClass} hover:shadow-lg transition`}
      style={{ cursor: 'pointer' }}
    >
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

  useEffect(() => {
    // Replace with backend API fetch if needed
  }, []);

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
        <StatCard
          title="Active Students"
          value={stats.activeStudents}
          iconClass="bi-journal-check"
          bgClass="bg-info bg-opacity-10"
          textClass="text-info"
        />
        <StatCard
          title="Unpaid Fees"
          value={`₦${stats.unpaidFees}`}
          iconClass="bi-currency-dollar"
          bgClass="bg-success bg-opacity-10"
          textClass="text-success"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          iconClass="bi-clock-fill"
          bgClass="bg-danger bg-opacity-10"
          textClass="text-danger"
        />
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-12">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">Fees Collection Trend</h6>
            <Bar
              data={barData}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
      </div>

      {/* Sparkline Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-12">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">Pending Approvals Over Time</h6>
            <Line
              data={sparklineData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                elements: { point: { radius: 3 } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3 mt-4">
        {['View Results', 'View Payments'].map((action, i) => (
          <div className="col-6" key={i}>
            <button className="btn btn-outline-primary w-100 rounded-4 py-3 fw-semibold">
              {action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
