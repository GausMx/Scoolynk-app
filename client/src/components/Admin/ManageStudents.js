// src/components/Admin/ManageStudents.js

import React, { useState } from 'react';
import { Users, Edit, Trash2, PlusCircle, Search } from 'lucide-react';

// Mock Data
const MOCK_STUDENTS = [
    { id: 's001', name: 'Ngozi Okoro', regNo: 'SCH001', class: 'JSS 1', parentName: 'Mr. David Okoro' },
    { id: 's002', name: 'Chinedu Eze', regNo: 'SCH002', class: 'SSS 3', parentName: 'Mrs. Chioma Eze' },
    { id: 's003', name: 'Fatima Bello', regNo: 'SCH003', class: 'JSS 2', parentName: 'Alhaji Abdul Bello' },
    { id: 's004', name: 'Kunle Adebayo', regNo: 'SCH004', class: 'SSS 1', parentName: 'Ms. Tola Adebayo' },
];
// Mock data for class and parent dropdowns
const MOCK_CLASS_OPTIONS = ['JSS 1', 'JSS 2', 'SSS 1', 'SSS 2', 'SSS 3'];
const MOCK_PARENTS = [
    { id: 'p101', name: 'Mr. David Okoro' },
    { id: 'p102', name: 'Mrs. Chioma Eze' },
    { id: 'p103', name: 'Alhaji Abdul Bello' },
    { id: 'p104', name: 'Ms. Tola Adebayo' },
    { id: 'p105', name: 'New Parent (Not yet linked)' },
];


const ManageStudents = () => {
    const [students, setStudents] = useState(MOCK_STUDENTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // State for the Add/Edit Modal (0: closed, 1: Add, 2: Edit)
    const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentStudent: null });

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.class.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Placeholder CRUD Handlers (Replace with API calls)
    const handleAddOrEdit = (formData) => {
        setLoading(true);
        setMessage('');
        
        setTimeout(() => {
            if (modalState.mode === 'add') {
                const newStudent = { ...formData, id: 's' + Date.now() };
                setStudents(prev => [...prev, newStudent]);
                setMessage(`Student '${newStudent.name}' added successfully. (API simulation)`);
            } else {
                setStudents(prev => prev.map(s => 
                    s.id === formData.id ? { ...s, ...formData } : s
                ));
                setMessage(`Student '${formData.name}' updated successfully. (API simulation)`);
            }
            setLoading(false);
            setModalState({ isOpen: false, mode: 'add', currentStudent: null });
        }, 800);
    };

    const handleDelete = (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to delete student: ${studentName}?`)) {
            setLoading(true);
            setMessage('');
            setTimeout(() => {
                setStudents(prev => prev.filter(s => s.id !== studentId));
                setMessage(`Student '${studentName}' deleted successfully. (API simulation)`);
                setLoading(false);
            }, 800);
        }
    };
    
    // Form component for Add/Edit Modal
    const StudentForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
        const [formData, setFormData] = useState({ 
            name: initialData?.name || '', 
            regNo: initialData?.regNo || '',
            class: initialData?.class || MOCK_CLASS_OPTIONS[0],
            parentName: initialData?.parentName || MOCK_PARENTS[0].name,
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
                    <label className="form-label">Registration Number</label>
                    <input 
                        type="text" 
                        className="form-control rounded-3" 
                        name="regNo" 
                        value={formData.regNo} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Assigned Class</label>
                        <select
                            className="form-select rounded-3"
                            name="class"
                            value={formData.class}
                            onChange={handleChange}
                            required
                        >
                            {MOCK_CLASS_OPTIONS.map(cls => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6 mb-4">
                        <label className="form-label">Linked Parent</label>
                        <select
                            className="form-select rounded-3"
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleChange}
                            required
                        >
                            {MOCK_PARENTS.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                        <small className="form-text text-muted">Parent must be registered first.</small>
                    </div>
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (initialData ? 'Update Student' : 'Add Student')}
                    </button>
                </div>
            </form>
        );
    };


    return (
        <div className="card shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h4 className="card-title text-primary mb-0 d-flex align-items-center">
                    <Users size={24} className="me-2" /> Manage Students
                </h4>
                <button 
                    className="btn btn-primary rounded-3 d-flex align-items-center"
                    onClick={() => setModalState({ isOpen: true, mode: 'add', currentStudent: null })}
                >
                    <PlusCircle size={20} className="me-2" /> Add New Student
                </button>
            </div>

            {message && (
                <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">
                    {message}
                </div>
            )}
            
            {/* Search Input */}
            <div className="input-group mb-4" style={{ maxWidth: '300px' }}>
                <span className="input-group-text bg-light rounded-start-3"><Search size={18} /></span>
                <input
                    type="text"
                    className="form-control rounded-end-3"
                    placeholder="Search students, reg no or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Student Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Reg No</th>
                            <th scope="col">Class</th>
                            <th scope="col">Parent</th>
                            <th scope="col" className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((item) => (
                                <tr key={item.id}>
                                    <td className="fw-semibold">{item.name}</td>
                                    <td>{item.regNo}</td>
                                    <td><span className="badge bg-info text-dark">{item.class}</span></td>
                                    <td>{item.parentName}</td>
                                    <td className="text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-secondary me-2 rounded-3"
                                            onClick={() => setModalState({ isOpen: true, mode: 'edit', currentStudent: item })}
                                            title="Edit Student"
                                            disabled={loading}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger rounded-3"
                                            onClick={() => handleDelete(item.id, item.name)}
                                            title="Delete Student"
                                            disabled={loading}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center text-muted">No students found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal Implementation */}
            {modalState.isOpen && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 shadow-lg">
                            <div className="modal-header">
                                <h5 className="modal-title">{modalState.mode === 'add' ? 'Add New Student' : 'Edit Student'}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentStudent: null })}></button>
                            </div>
                            <div className="modal-body">
                                <StudentForm 
                                    initialData={modalState.currentStudent} 
                                    onSubmit={handleAddOrEdit} 
                                    onCancel={() => setModalState({ isOpen: false, mode: 'add', currentStudent: null })}
                                    isSaving={loading}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;
