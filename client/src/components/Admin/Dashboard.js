import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

// Icons
const Users = ({ className }) => <i className={`bi bi-people-fill ${className}`}></i>;
const BookOpen = ({ className }) => <i className={`bi bi-journal-check ${className}`}></i>;
const DollarSign = ({ className }) => <i className={`bi bi-currency-dollar ${className}`}></i>;
const Clock = ({ className }) => <i className={`bi bi-clock-fill ${className}`}></i>;

// Mock Stats
const MOCK_STATS = {
    totalUsers: '1,250',
    activeStudents: '1,000',
    unpaidFees: '25,000',
    pendingApprovals: 5,
    charts: {
        students: [900, 950, 980, 1000, 1020],
        fees: [2000, 5000, 10000, 15000, 25000],
        approvals: [1, 2, 3, 4, 5],
    },
};

// Mini Line Chart Component
const MiniChart = ({ dataPoints, color }) => {
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
            {
                data: dataPoints,
                borderColor: color,
                backgroundColor: 'transparent',
                tension: 0.3,
            },
        ],
    };
    const options = {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
    };
    return <Line data={data} options={options} height={50} />;
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, chartData }) => (
    <div className="col-12 col-sm-6 col-lg-3">
        <div className="card shadow-sm rounded-4 border-0 hover-shadow p-3" style={{ cursor: 'pointer' }}>
            <div className="d-flex align-items-center mb-2">
                <div className={`rounded-circle p-3 me-3 ${colorClass} d-flex justify-content-center align-items-center`} style={{ width: 60, height: 60 }}>
                    <Icon className="fs-3 text-white" />
                </div>
                <div>
                    <h6 className="text-muted mb-1">{title}</h6>
                    <h3 className="fw-bold mb-0">{value}</h3>
                </div>
            </div>
            {chartData && <MiniChart dataPoints={chartData} color="rgba(0,0,0,0.6)" />}
        </div>
    </div>
);

const Dashboard = () => (
    <div className="container py-4">
        <div className="mb-4">
            <h2 className="fw-bolder text-dark mb-2">School Admin Dashboard</h2>
            <p className="text-muted fs-6">Overview of students, parents, and fees at a glance.</p>
        </div>

        <div className="row g-4">
            <StatCard
                title="Total Users"
                value={MOCK_STATS.totalUsers}
                icon={Users}
                colorClass="bg-primary"
                chartData={MOCK_STATS.charts.students}
            />
            <StatCard
                title="Active Students"
                value={MOCK_STATS.activeStudents}
                icon={BookOpen}
                colorClass="bg-info"
                chartData={MOCK_STATS.charts.students}
            />
            <StatCard
                title="Unpaid Fees"
                value={`₦${MOCK_STATS.unpaidFees}`}
                icon={DollarSign}
                colorClass="bg-success"
                chartData={MOCK_STATS.charts.fees}
            />
            <StatCard
                title="Pending Approvals"
                value={MOCK_STATS.pendingApprovals}
                icon={Clock}
                colorClass="bg-danger"
                chartData={MOCK_STATS.charts.approvals}
            />
        </div>

        <div className="mt-5 p-3 rounded-4 bg-light border-top">
            <i className="bi bi-info-circle-fill me-2 text-muted"></i>
            <span className="fw-bold">Note:</span> Data should be fetched from your backend API.
        </div>
    </div>
);

export default Dashboard;
