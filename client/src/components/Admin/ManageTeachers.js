// src/components/Admin/ManageTeachers.js
import React, { useState } from 'react';

// Consistent Icon components using Bootstrap Icon classes
const IconEdit = ({ className }) => <i className={`bi bi-pencil-square ${className}`}></i>;
const IconTrash = ({ className }) => <i className={`bi bi-trash-fill ${className}`}></i>;
const IconPlus = ({ className }) => <i className={`bi bi-plus-circle-fill ${className}`}></i>;
const IconSearch = ({ className }) => <i className={`bi bi-search ${className}`}></i>;
const IconTeachers = ({ className }) => <i className={`bi bi-person-video2 fs-4 ${className}`}></i>;

// Mock Data
const MOCK_TEACHERS = [
    { id: 't001', name: 'Mrs. Jane Doe', subject: 'Mathematics', phone: '0901-111-2222', coursesTaught: 3 },
    { id: 't002', name: 'Mr. Ken Adams', subject: 'Physics', phone: '0802-333-4444', coursesTaught: 2 },
    { id: 't003', name: 'Ms. Sarah Connor', subject: 'English Language', phone: '0703-555-6666', coursesTaught: 1 },
    { id: 't004', name: 'Dr. John Miller', subject: 'Chemistry', phone: '0814-777-8888', coursesTaught: 2 },
];
const MOCK_SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'English Language', 'Chemistry', 'Biology', 'History'];

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState(MOCK_TEACHERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentTeacher: null });

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /**
     * Placeholder API Function: Handles creating a new teacher or updating an existing one.
     * Replace the setTimeout logic with your actual API call.
     */
    const handleAddOrEdit = (formData) => {
        setLoading(true);
        setMessage('');
        
        // Simulating API latency
        setTimeout(() => {
            if (modalState.mode === 'add') {
                const newTeacher = { ...formData, id: 't' + Date.now(), coursesTaught: 0 };
                setTeachers(prev => [...prev, newTeacher]);
                setMessage(`Teacher '${newTeacher.name}' added successfully. (API simulation)`);
            } else {
                setTeachers(prev => prev.map(t => 
                    t.id === formData.id ? { ...t, ...formData } : t
                ));
                setMessage(`Teacher '${formData.name}' updated successfully. (API simulation)`);
            }
            setLoading(false);
            setModalState({ isOpen: false, mode: 'add', currentTeacher: null });
        }, 800);
    };

    /**
     * Placeholder API Function: Handles deleting a teacher.
     * Replace the setTimeout logic with your actual API call.
     */
    const handleDelete = (teacherId, teacherName) => {
        if (window.confirm(`Are you sure you want to delete teacher: ${teacherName}? This will unassign them from all courses.`)) {
            setLoading(true);
            setMessage('');
            
            // Simulating API latency
            setTimeout(() => {
                setTeachers(prev => prev.filter(t => t.id !== teacherId));
                setMessage(`Teacher '${teacherName}' deleted successfully. (API simulation)`);
                setLoading(false);
            }, 800);
        }
    };
    
    // Form component for Add/Edit Modal
    const TeacherForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
        const [formData, setFormData] = useState({ 
            name: initialData?.name || '', 
            subject: initialData?.subject || MOCK_SUBJECT_OPTIONS[0],
            phone: initialData?.phone || '',
        });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit({ ...initialData, ...formData });
        };

        return (
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input 
                        type="text" 
                        className="form-control rounded-3" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Primary Subject</label>
                    <select
                        className="form-select rounded-3"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                    >
                        {MOCK_SUBJECT_OPTIONS.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="form-label">Phone Number</label>
                    <input 
                        type="tel" 
                        className="form-control rounded-3" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (initialData ? 'Update Teacher' : 'Add Teacher')}
                    </button>
                </div>
            </form>
        );
    };


    return (
        <div className="container py-4">
            <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <h4 className="card-title text-dark mb-0 d-flex align-items-center fw-bold">
                        <IconTeachers className="text-primary me-2" /> Manage Teachers
                    </h4>
                    <button 
                        className="btn btn-primary rounded-pill d-flex align-items-center px-4 py-2"
                        onClick={() => setModalState({ isOpen: true, mode: 'add', currentTeacher: null })}
                    >
                        <IconPlus className="me-2 fs-5" /> Add New Teacher
                    </button>
                </div>

                {message && (
                    <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">
                        {message}
                    </div>
                )}
                
                {/* Search Input */}
                <div className="input-group mb-4" style={{ maxWidth: '400px' }}>
                    <span className="input-group-text bg-light rounded-start-pill border-0"><IconSearch className="fs-6" /></span>
                    <input
                        type="text"
                        className="form-control rounded-end-pill"
                        placeholder="Search by name or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Teacher Table */}
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="fw-bold">Name</th>
                                <th scope="col" className="fw-bold">Primary Subject</th>
                                <th scope="col" className="fw-bold">Phone</th>
                                <th scope="col" className="fw-bold text-center">Courses Taught</th>
                                <th scope="col" className="text-center fw-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.length > 0 ? (
                                filteredTeachers.map((item) => (
                                    <tr key={item.id}>
                                        <td className="fw-semibold">{item.name}</td>
                                        <td><span className="badge bg-primary rounded-pill">{item.subject}</span></td>
                                        <td>{item.phone}</td>
                                        <td className="text-center">{item.coursesTaught}</td>
                                        <td className="text-center">
                                            <button 
                                                className="btn btn-sm btn-outline-secondary me-2 rounded-3"
                                                onClick={() => setModalState({ isOpen: true, mode: 'edit', currentTeacher: item })}
                                                title="Edit Teacher"
                                                disabled={loading}
                                            >
                                                <IconEdit className="fs-6" />
                                            </button>
                                            {/* Fixed 'id' context issue by explicitly using item.id */}
                                            <button 
                                                className="btn btn-sm btn-outline-danger rounded-3"
                                                onClick={() => handleDelete(item.id, item.name)}
                                                title="Delete Teacher"
                                                disabled={loading || item.coursesTaught > 0}
                                            >
                                                <IconTrash className="fs-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-3">No teachers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Modal Implementation */}
                {modalState.isOpen && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content rounded-4 shadow-lg border-0">
                                <div className="modal-header bg-light border-bottom">
                                    <h5 className="modal-title fw-bold text-dark">{modalState.mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentTeacher: null })}></button>
                                </div>
                                <div className="modal-body">
                                    <TeacherForm 
                                        initialData={modalState.currentTeacher} 
                                        onSubmit={handleAddOrEdit} 
                                        onCancel={() => setModalState({ isOpen: false, mode: 'add', currentTeacher: null })}
                                        isSaving={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageTeachers;
