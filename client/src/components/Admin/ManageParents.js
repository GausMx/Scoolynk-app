import React, { useState } from 'react';

// Icon components using Bootstrap Icon classes (assuming Bootstrap Icons are available)
const Check = ({ size, className }) => <i className={`bi bi-check-lg fs-${size === 18 ? 6 : 5} ${className}`}></i>;
const X = ({ size, className }) => <i className={`bi bi-x-lg fs-${size === 18 ? 6 : 5} ${className}`}></i>;
const Trash2 = ({ size, className }) => <i className={`bi bi-trash fs-${size === 18 ? 6 : 5} ${className}`}></i>;
const Search = ({ size, className }) => <i className={`bi bi-search fs-${size === 20 ? 6 : 5} ${className}`}></i>;
const UserPlus = ({ size, className }) => <i className={`bi bi-person-plus fs-${size === 20 ? 6 : 5} ${className}`}></i>;


// Mock data including a 'status' for approval
const MOCK_PARENT_DATA = [
    { id: 'parent-1', name: 'Alice Johnson', email: 'alice@example.com', student: 'Leo Johnson (JSS 2)', status: 'Approved' },
    { id: 'parent-2', name: 'Bob Smith', email: 'bob@example.com', student: 'Mia Smith (SSS 1)', status: 'Pending' },
    { id: 'parent-3', name: 'Charlie Brown', email: 'charlie@example.com', student: 'Sam Brown (JSS 1)', status: 'Pending' },
    { id: 'parent-4', name: 'Diana Prince', email: 'diana@example.com', student: 'Clark Prince (SSS 3)', status: 'Approved' },
];

const ManageParents = () => {
    const [parents, setParents] = useState(MOCK_PARENT_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // ** API Integration Note: This should be run on mount to fetch all parents **
    // useEffect(() => { fetchParents() }, []);

    const filteredParents = parents.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateParentStatus = (parentId, newStatus) => {
        setLoading(true);
        setMessage('');

        // ** API Integration Note: Replace setTimeout with your actual API PUT call **
        setTimeout(() => {
            setParents(prev => prev.map(p => 
                p.id === parentId ? { ...p, status: newStatus } : p
            ));
            setLoading(false);
            setMessage(`Successfully updated parent status to ${newStatus}. (API simulation)`);
        }, 800);
    };

    const deleteParent = (parentId) => {
        setLoading(true);
        setMessage('');

        // ** API Integration Note: Replace setTimeout with your actual API DELETE call **
        setTimeout(() => {
            setParents(prev => prev.filter(p => p.id !== parentId));
            setLoading(false);
            setMessage('Parent deleted successfully. (API simulation)');
        }, 800);
    };

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Approved': return 'bg-success text-white';
            case 'Pending': return 'bg-warning text-dark';
            default: return 'bg-secondary text-white';
        }
    };

    return (
        <div className="container py-4">
            <div className="card p-4 shadow-lg border-0 rounded-4">
                
                <h2 className="text-primary fw-bolder mb-4 d-flex align-items-center">
                    <i className="bi bi-people-fill fs-4 me-3 text-secondary"></i> Manage Parents
                </h2>

                {/* Message / Alert Box (Bootstrap Alert) */}
                {message && (
                    <div 
                        className={`alert rounded-3 mb-4 alert-dismissible fade show ${message.includes('success') || message.includes('deleted') ? 'alert-success' : 'alert-info'}`}
                        role="alert"
                    >
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
                    </div>
                )}

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    {/* Search Bar (Bootstrap Input Group) */}
                    <div className="input-group" style={{ maxWidth: '450px' }}>
                        <span className="input-group-text bg-white border-end-0 rounded-start-3">
                            <Search size={20} className="text-secondary" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="form-control rounded-end-3 border-start-0 focus-ring shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* Add Parent Button */}
                    <button 
                        className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center px-4"
                        onClick={() => setMessage('Add Parent modal functionality goes here.')}
                        disabled={loading}
                    >
                        <UserPlus size={20} className="me-2" /> Add Parent
                    </button>
                </div>

                {loading && <div className="text-center py-4 text-primary">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                </div>}

                {/* Parents Table (Bootstrap Table) */}
                <div className="table-responsive border rounded-4">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Name</th>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Email</th>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Student</th>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Status</th>
                                <th scope="col" className="px-3 py-3 text-center text-uppercase fw-bold text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParents.length > 0 ? (
                                filteredParents.map((parent) => (
                                    <tr key={parent.id}>
                                        <td className="px-3 py-3 fw-bold">{parent.name}</td>
                                        <td className="px-3 py-3 text-muted">{parent.email}</td>
                                        <td className="px-3 py-3 text-muted">{parent.student}</td>
                                        <td className="px-3 py-3">
                                            <span className={`badge ${getStatusClasses(parent.status)} fw-normal p-2 rounded-pill`}>
                                                {parent.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            
                                            {/* Action Buttons */}
                                            {parent.status === 'Pending' && (
                                                <button
                                                    className="btn btn-sm btn-success mx-1 rounded-pill"
                                                    title="Approve Registration"
                                                    onClick={() => updateParentStatus(parent.id, 'Approved')}
                                                    disabled={loading}
                                                >
                                                    <Check size={18} />
                                                </button>
                                            )}
                                            {parent.status === 'Approved' && (
                                                <button
                                                    className="btn btn-sm btn-warning mx-1 rounded-pill text-dark"
                                                    title="Deactivate Account"
                                                    onClick={() => updateParentStatus(parent.id, 'Pending')}
                                                    disabled={loading}
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm btn-outline-danger mx-1 rounded-pill"
                                                title="Delete Account"
                                                onClick={() => deleteParent(parent.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">No parents found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="mt-4 text-muted border-top pt-3">
                    <i className="bi bi-info-circle-fill me-1"></i> 
                    **API Integration Note:** Fetch data from `/api/admin/parents` and use mutation endpoints like `/api/admin/parents/{id}/approve` or `/api/admin/parents/{id}` (DELETE).
                </p>
            </div>
        </div>
    );
};

export default ManageParents;
