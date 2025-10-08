import React from 'react';

// Icon components using Bootstrap Icon classes
const Users = ({ className }) => <i className={`bi bi-people-fill fs-2 ${className}`}></i>;
const BookOpen = ({ className }) => <i className={`bi bi-journal-check fs-2 ${className}`}></i>;
const DollarSign = ({ className }) => <i className={`bi bi-currency-dollar fs-2 ${className}`}></i>;
const Clock = ({ className }) => <i className={`bi bi-clock-fill fs-2 ${className}`}></i>;

// Mock data used for frontend visualization
const MOCK_STATS = {
    totalUsers: '1,250',
    activeStudents: '1,000',
    unpaidFees: '25,000',
    pendingApprovals: 5,
};

// Simple utility component for the Stat Card
const StatCard = ({ title, value, icon: Icon, themeClass, borderClass, textClass }) => (
    <div className="col-12 col-sm-6 col-md-6 col-lg-3">
        {/* Use shadow-sm on mobile, shadow-lg on hover/desktop for interactivity */}
        <div 
            className={`card text-center h-100 p-3 ${themeClass} ${borderClass} rounded-4 shadow-sm hover:shadow-xl transition duration-300 ease-in-out`}
            style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out'
            }}
        >
            <div className="card-body">
                <Icon className={`${textClass} mb-3`} />
                <h3 className="fs-6 fw-semibold text-muted mb-1">{title}</h3>
                {/* Responsive Font Size for the main value (display-6 on small, display-5 on medium+) */}
                <p className="display-6 d-md-none fw-bold mb-0 text-dark">{value}</p>
                <p className="display-5 d-none d-md-block fw-bold mb-0 text-dark">{value}</p>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="container py-4">
            <div className="card p-3 p-sm-5 shadow-lg border-0 rounded-4">
                {/* Responsive Header Styling: fs-4 on mobile, fs-2 on desktop */}
                <h2 className="fs-4 fs-sm-2 fw-bolder text-dark mb-4 border-bottom pb-3">
                    Administrative Overview
                </h2>
                
                {/* Card Grid Layout */}
                <div className="row g-4">
                    
                    {/* Card 1: Total Users */}
                    <StatCard
                        title="Total Users"
                        value={MOCK_STATS.totalUsers}
                        icon={Users}
                        themeClass="bg-primary bg-opacity-10"
                        borderClass="border-primary"
                        textClass="text-primary"
                    />
                    
                    {/* Card 2: Active Students */}
                    <StatCard
                        title="Active Students"
                        value={MOCK_STATS.activeStudents}
                        icon={BookOpen}
                        themeClass="bg-info bg-opacity-10"
                        borderClass="border-info"
                        textClass="text-info"
                    />
                    
                    {/* Card 3: Unpaid Fees */}
                    <StatCard
                        title="Unpaid Fees"
                        // Add currency symbol in the card itself
                        value={`$${MOCK_STATS.unpaidFees}`}
                        icon={DollarSign}
                        themeClass="bg-success bg-opacity-10"
                        borderClass="border-success"
                        textClass="text-success"
                    />
                    
                    {/* Card 4: Pending Approvals (Critical Items) */}
                    <StatCard
                        title="Pending Approvals"
                        value={MOCK_STATS.pendingApprovals}
                        icon={Clock}
                        themeClass="bg-danger bg-opacity-10"
                        borderClass="border-danger"
                        textClass="text-danger"
                    />
                </div>

                {/* Footer Note */}
                <p className="mt-5 text-muted border-top pt-3 fs-6">
                    <i className="bi bi-gear-fill me-1"></i> 
                    <span className="fw-bold">API Integration Note:</span> This data should be fetched from your core backend endpoint.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
