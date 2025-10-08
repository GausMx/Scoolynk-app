import React from 'react';

// Icon components using Bootstrap Icon classes (assuming Bootstrap Icons are available)
// Size is approximated for visual balance
const Users = ({ size, className }) => <i className={`bi bi-people-fill fs-3 ${className}`}></i>;
const BookOpen = ({ size, className }) => <i className={`bi bi-journal-check fs-3 ${className}`}></i>;
const DollarSign = ({ size, className }) => <i className={`bi bi-currency-dollar fs-3 ${className}`}></i>;
const Clock = ({ size, className }) => <i className={`bi bi-clock-fill fs-3 ${className}`}></i>;

// Mock data used for frontend visualization
const MOCK_STATS = {
    totalUsers: '1,250',
    activeStudents: '1,000',
    unpaidFees: '25,000',
    pendingApprovals: 5,
};

const Dashboard = () => {
  return (
    <div className="container py-4">
        <div className="card p-4 shadow-lg border-0 rounded-4">
            <h2 className="text-3xl fw-bolder text-dark mb-4 border-bottom pb-3">Administrative Overview</h2>
            
            <div className="row g-4">
                
                {/* Card 1: Total Users (Primary/Blue theme) */}
                <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                    <div className="card text-center h-100 p-3 bg-primary bg-opacity-10 border-primary rounded-4">
                        <div className="card-body">
                            <Users className="text-primary mb-3" />
                            <h3 className="fs-5 fw-semibold text-primary mb-1">Total Users</h3>
                            <p className="display-6 fw-bold mb-0 text-dark">{MOCK_STATS.totalUsers}</p>
                        </div>
                    </div>
                </div>
                
                {/* Card 2: Active Students (Info/Cyan theme) */}
                <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                    <div className="card text-center h-100 p-3 bg-info bg-opacity-10 border-info rounded-4">
                        <div className="card-body">
                            <BookOpen className="text-info mb-3" />
                            <h3 className="fs-5 fw-semibold text-info mb-1">Active Students</h3>
                            <p className="display-6 fw-bold mb-0 text-dark">{MOCK_STATS.activeStudents}</p>
                        </div>
                    </div>
                </div>
                
                {/* Card 3: Unpaid Fees (Success/Green theme) */}
                <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                    <div className="card text-center h-100 p-3 bg-success bg-opacity-10 border-success rounded-4">
                        <div className="card-body">
                            <DollarSign className="text-success mb-3" />
                            <h3 className="fs-5 fw-semibold text-success mb-1">Unpaid Fees</h3>
                            <p className="display-6 fw-bold mb-0 text-dark">${MOCK_STATS.unpaidFees}</p>
                        </div>
                    </div>
                </div>
                
                {/* Card 4: Pending Approvals (Danger/Red theme) */}
                <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                    <div className="card text-center h-100 p-3 bg-danger bg-opacity-10 border-danger rounded-4">
                        <div className="card-body">
                            <Clock className="text-danger mb-3" />
                            <h3 className="fs-5 fw-semibold text-danger mb-1">Pending Approvals</h3>
                            <p className="display-6 fw-bold mb-0 text-dark">{MOCK_STATS.pendingApprovals}</p>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-5 text-muted border-top pt-3 fs-6">
                <i className="bi bi-gear-fill me-1"></i> 
                **API Integration Note:** The data displayed here should be fetched from your core API endpoint (e.g., `/api/admin/dashboard-stats`).
            </p>
        </div>
    </div>
  );
};

export default Dashboard;
