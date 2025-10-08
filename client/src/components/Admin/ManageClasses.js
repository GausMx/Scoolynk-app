// src/components/Admin/ManageClasses.js

import React, { useState } from 'react';
import { BookOpen, Edit, Trash2, PlusCircle, Search } from 'lucide-react';

// Mock Data
const MOCK_CLASSES = [
    { id: 'c001', name: 'JSS 1', maxCapacity: 45, studentCount: 40 },
    { id: 'c002', name: 'JSS 2', maxCapacity: 40, studentCount: 38 },
    { id: 'c003', name: 'SSS 1', maxCapacity: 50, studentCount: 50 },
    { id: 'c004', name: 'SSS 3', maxCapacity: 35, studentCount: 30 },
];

const ManageClasses = () => {
    const [classes, setClasses] = useState(MOCK_CLASSES);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // State for the Add/Edit Modal (0: closed, 1: Add, 2: Edit)
    const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentClass: null });

    const filteredClasses = classes.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Placeholder CRUD Handlers (Replace with API calls)
    const handleAddOrEdit = (formData) => {
        setLoading(true);
        setMessage('');
        
        setTimeout(() => {
            if (modalState.mode === 'add') {
                const newClass = { ...formData, id: 'c' + Date.now(), studentCount: 0 };
                setClasses(prev => [...prev, newClass]);
                setMessage(`Class '${newClass.name}' added successfully. (API simulation)`);
            } else {
                setClasses(prev => prev.map(c => 
                    c.id === formData.id ? { ...c, ...formData } : c
                ));
                setMessage(`Class '${formData.name}' updated successfully. (API simulation)`);
            }
            setLoading(false);
            setModalState({ isOpen: false, mode: 'add', currentClass: null });
        }, 800);
    };

    const handleDelete = (classId, className) => {
        if (window.confirm(`Are you sure you want to delete class: ${className}?`)) {
            setLoading(true);
            setMessage('');
            setTimeout(() => {
                setClasses(prev => prev.filter(c => c.id !== classId));
                setMessage(`Class '${className}' deleted successfully. (API simulation)`);
                setLoading(false);
            }, 800);
        }
    };
    
    // Form component for Add/Edit Modal
    const ClassForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
        const [formData, setFormData] = useState({ 
            name: initialData?.name || '', 
            maxCapacity: initialData?.maxCapacity || '' 
        });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit({ ...initialData, ...formData, maxCapacity: parseInt(formData.maxCapacity) });
        };

        return (
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Class Name (e.g., JSS 1)</label>
                    <input 
                        type="text" 
                        className="form-control rounded-3" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="mb-4">
                    <label className="form-label">Max Capacity</label>
                    <input 
                        type="number" 
                        className="form-control rounded-3" 
                        name="maxCapacity" 
                        value={formData.maxCapacity} 
                        onChange={handleChange} 
                        min="1"
                        required 
                    />
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (initialData ? 'Update Class' : 'Add Class')}
                    </button>
                </div>
            </form>
        );
    };


    return (
        <div className="card shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h4 className="card-title text-primary mb-0 d-flex align-items-center">
                    <BookOpen size={24} className="me-2" /> Manage Academic Classes
                </h4>
                <button 
                    className="btn btn-primary rounded-3 d-flex align-items-center"
                    onClick={() => setModalState({ isOpen: true, mode: 'add', currentClass: null })}
                >
                    <PlusCircle size={20} className="me-2" /> Add New Class
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
                    placeholder="Search classes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Class Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col">Class Name</th>
                            <th scope="col">Capacity</th>
                            <th scope="col">Students</th>
                            <th scope="col" className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClasses.length > 0 ? (
                            filteredClasses.map((item) => (
                                <tr key={item.id}>
                                    <td className="fw-semibold">{item.name}</td>
                                    <td>{item.maxCapacity}</td>
                                    <td>
                                        {item.studentCount} / {item.maxCapacity}
                                        {item.studentCount >= item.maxCapacity && <span className="badge bg-danger ms-2">Full</span>}
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-secondary me-2 rounded-3"
                                            onClick={() => setModalState({ isOpen: true, mode: 'edit', currentClass: item })}
                                            title="Edit Class"
                                            disabled={loading}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger rounded-3"
                                            onClick={() => handleDelete(item.id, item.name)}
                                            title="Delete Class"
                                            disabled={loading}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted">No classes found.</td>
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
                                <h5 className="modal-title">{modalState.mode === 'add' ? 'Add New Class' : 'Edit Class'}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentClass: null })}></button>
                            </div>
                            <div className="modal-body">
                                <ClassForm 
                                    initialData={modalState.currentClass} 
                                    onSubmit={handleAddOrEdit} 
                                    onCancel={() => setModalState({ isOpen: false, mode: 'add', currentClass: null })}
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

export default ManageClasses;
