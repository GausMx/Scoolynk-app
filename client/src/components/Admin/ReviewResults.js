// src/components/Admin/ReviewResults.js
import React, { useState } from 'react';

// Consistent Icon components using Bootstrap Icon classes
const IconEdit = ({ className }) => <i className={`bi bi-pencil-square ${className}`}></i>;
const IconTrash = ({ className }) => <i className={`bi bi-trash-fill ${className}`}></i>;
const IconReview = ({ className }) => <i className={`bi bi-bar-chart-line-fill fs-4 ${className}`}></i>;
const IconCheck = ({ className }) => <i className={`bi bi-check-circle-fill ${className}`}></i>; // Defined 'Check' replacement
const IconX = ({ className }) => <i className={`bi bi-x-circle-fill ${className}`}></i>; // Defined 'X' replacement

// Mock Data
const MOCK_RESULTS = [
    { id: 'res1', studentName: 'Ngozi Okoro', class: 'JSS 1', subject: 'Mathematics', score: 75, status: 'Pending' },
    { id: 'res2', studentName: 'Chinedu Eze', class: 'SSS 3', subject: 'Physics', score: 88, status: 'Approved' },
    { id: 'res3', studentName: 'Fatima Bello', class: 'JSS 2', subject: 'English', score: 42, status: 'Rejected' },
    { id: 'res4', studentName: 'Kunle Adebayo', class: 'SSS 1', subject: 'Chemistry', score: 95, status: 'Pending' },
];

const ReviewResults = () => {
    const [results, setResults] = useState(MOCK_RESULTS);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    /**
     * Placeholder API Function: Handles approving or rejecting a result.
     * Replaces the logic with your actual API call (e.g., PUT /api/results/{id}/status).
     */
    const handleUpdateStatus = (resultId, studentName, newStatus) => {
        setLoading(true);
        setMessage('');

        setTimeout(() => {
            setResults(prev => prev.map(res => 
                res.id === resultId ? { ...res, status: newStatus } : res
            ));
            setMessage(`Result for ${studentName} ${newStatus} successfully. (API simulation)`);
            setLoading(false);
        }, 800);
    };

    /**
     * Placeholder API Function: Handles editing a result (opens modal).
     */
    const handleEdit = (result) => {
        // In a real app, open a modal with the result data for editing score/details.
        alert(`Edit feature: Opening editor for result ID: ${result.id}`); 
    };

    return (
        <div className="container py-4">
            <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <h4 className="card-title text-dark mb-0 d-flex align-items-center fw-bold">
                        <IconReview className="text-primary me-2" /> Review Pending Results
                    </h4>
                </div>

                {message && (
                    <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">
                        {message}
                    </div>
                )}
                
                {/* Results Table */}
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="fw-bold">Student Name</th>
                                <th scope="col" className="fw-bold">Class</th>
                                <th scope="col" className="fw-bold">Subject</th>
                                <th scope="col" className="fw-bold text-center">Score</th>
                                <th scope="col" className="fw-bold text-center">Status</th>
                                <th scope="col" className="text-center fw-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length > 0 ? (
                                results.map((item) => (
                                    <tr key={item.id}>
                                        <td className="fw-semibold">{item.studentName}</td>
                                        <td>{item.class}</td>
                                        <td>{item.subject}</td>
                                        <td className="text-center">{item.score}</td>
                                        <td className="text-center">
                                            {item.status === 'Pending' && <span className="badge bg-warning text-dark rounded-pill">Pending</span>}
                                            {item.status === 'Approved' && <span className="badge bg-success rounded-pill">Approved</span>}
                                            {item.status === 'Rejected' && <span className="badge bg-danger rounded-pill">Rejected</span>}
                                        </td>
                                        <td className="text-center">
                                            {item.status === 'Pending' ? (
                                                <>
                                                    {/* The ESLint errors for 'Check' and 'X' occurred here. Now using defined components: IconCheck and IconX */}
                                                    <button 
                                                        className="btn btn-sm btn-outline-success me-2 rounded-3"
                                                        onClick={() => handleUpdateStatus(item.id, item.studentName, 'Approved')} // Fixed 'id' context
                                                        title="Approve Result"
                                                        disabled={loading}
                                                    >
                                                        <IconCheck className="fs-6" />
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger me-2 rounded-3"
                                                        onClick={() => handleUpdateStatus(item.id, item.studentName, 'Rejected')} // Fixed 'id' context
                                                        title="Reject Result"
                                                        disabled={loading}
                                                    >
                                                        <IconX className="fs-6" />
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary rounded-3"
                                                        onClick={() => handleEdit(item)} 
                                                        title="Edit Score"
                                                        disabled={loading}
                                                    >
                                                        <IconEdit className="fs-6" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    className="btn btn-sm btn-outline-secondary rounded-3"
                                                    onClick={() => handleEdit(item)} 
                                                    title="View Details"
                                                    disabled={loading}
                                                >
                                                    <IconEdit className="fs-6" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-3">No results found requiring review.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReviewResults;
