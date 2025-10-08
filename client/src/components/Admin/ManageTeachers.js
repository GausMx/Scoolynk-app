import React, { useState } from 'react';
// Replacing Lucide icons with custom components using standard Bootstrap Icon classes (bi bi-*)

// Icon components using Bootstrap Icon classes
const Check = ({ size, className }) => <i className={`bi bi-check-lg fs-${size === 18 ? 6 : 5} ${className}`}></i>;
const X = ({ size, className }) => <i className={`bi bi-x-lg fs-${size === 18 ? 6 : 5} ${className}`}></i>;
const Trash2 = ({ size, className }) => <i className={`bi bi-trash fs-${size === 18 ? 6 : 5} ${className}`}></i>;
const Search = ({ size, className }) => <i className={`bi bi-search fs-${size === 20 ? 6 : 5} ${className}`}></i>;
const UserPlus = ({ size, className }) => <i className={`bi bi-person-plus fs-${size === 20 ? 6 : 5} ${className}`}></i>;


// Mock data including a 'status' for approval
const MOCK_TEACHER_DATA = [
    { id: 'teacher-1', name: 'Mr. Ken Adams', email: 'ken.a@scoolynk.edu', subject: 'Mathematics', status: 'Approved' },
    { id: 'teacher-2', name: 'Ms. Sarah Connor', email: 's.connor@scoolynk.edu', subject: 'English Language', status: 'Pending' },
    { id: 'teacher-3', name: 'Dr. John Miller', email: 'j.miller@scoolynk.edu', subject: 'Physics', status: 'Approved' },
    { id: 'teacher-4', name: 'Mrs. Jane Doe', email: 'j.doe@scoolynk.edu', subject: 'Chemistry', status: 'Pending' },
];

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState(MOCK_TEACHER_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // ** API Integration Note: This should be run on mount to fetch all teachers **
    // useEffect(() => { fetchTeachers() }, []);

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateTeacherStatus = (teacherId, newStatus) => {
        setLoading(true);
        setMessage('');

        // ** API Integration Note: Replace setTimeout with your actual API PUT call **
        setTimeout(() => {
            setTeachers(prev => prev.map(t => 
                t.id === teacherId ? { ...t, status: newStatus } : t
            ));
            setLoading(false);
            setMessage(`Successfully updated teacher status to ${newStatus}. (API simulation)`);
        }, 800);
    };

    const deleteTeacher = (teacherId) => {
        setLoading(true);
        setMessage('');

        // ** API Integration Note: Replace setTimeout with your actual API DELETE call **
        setTimeout(() => {
            setTeachers(prev => prev.filter(t => t.id !== teacherId));
            setLoading(false);
            setMessage('Teacher deleted successfully. (API simulation)');
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
                    <i className="bi bi-person-video2 fs-4 me-3 text-secondary"></i> Manage Teachers
                </h2>

                {/* Message / Alert Box */}
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
                    <div className="input-group" style={{ maxWidth: '400px' }}>
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
                    
                    {/* Add Teacher Button */}
                    <button 
                        className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center px-4"
                        onClick={() => setMessage('Add Teacher modal functionality goes here.')}
                        disabled={loading}
                    >
                        <UserPlus size={20} className="me-2" /> Add Teacher
                    </button>
                </div>

                {loading && <div className="text-center py-4 text-primary">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                </div>}

                {/* Teachers Table (Bootstrap Table) */}
                <div className="table-responsive border rounded-4">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Name</th>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Email</th>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Subject</th>
                                <th scope="col" className="px-3 py-3 text-start text-uppercase fw-bold text-secondary">Status</th>
                                <th scope="col" className="px-3 py-3 text-center text-uppercase fw-bold text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="px-3 py-3 fw-bold">{teacher.name}</td>
                                        <td className="px-3 py-3 text-muted">{teacher.email}</td>
                                        <td className="px-3 py-3 text-muted">{teacher.subject}</td>
                                        <td className="px-3 py-3">
                                            <span className={`badge ${getStatusClasses(teacher.status)} fw-normal p-2 rounded-pill`}>
                                                {teacher.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            
                                            {/* Action Buttons */}
                                            {teacher.status === 'Pending' && (
                                                <button
                                                    className="btn btn-sm btn-success mx-1 rounded-pill"
                                                    title="Approve Registration"
                                                    onClick={() => updateTeacherStatus(teacher.id, 'Approved')}
                                                    disabled={loading}
                                                >
                                                    <Check size={18} />
                                                </button>
                                            )}
                                            {teacher.status === 'Approved' && (
                                                <button
                                                    className="btn btn-sm btn-warning mx-1 rounded-pill text-dark"
                                                    title="Deactivate Account"
                                                    onClick={() => updateTeacherStatus(teacher.id, 'Pending')}
                                                    disabled={loading}
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm btn-outline-danger mx-1 rounded-pill"
                                                title="Delete Account"
                                                onClick={() => deleteTeacher(teacher.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">No teachers found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="mt-4 text-muted border-top pt-3">
                    <i className="bi bi-info-circle-fill me-1"></i> 
                    **API Integration Note:** Fetch data from `/api/admin/teachers` and use mutation endpoints like `/api/admin/teachers/{id}/approve` or `/api/admin/teachers/{id}` (DELETE).
                </p>
            </div>
        </div>
    );
};



export default ManageTeachers;
