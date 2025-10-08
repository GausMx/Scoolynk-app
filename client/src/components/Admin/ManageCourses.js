// src/components/Admin/ManageCourses.js

import React, { useState } from 'react';
import { BookMarked, Edit, Trash2, PlusCircle, Search } from 'lucide-react';

// Mock Data
const MOCK_COURSES = [
    { id: 'crs101', name: 'Mathematics', code: 'MAT101', teacher: 'Mrs. Jane Doe', classes: ['JSS 1', 'JSS 2'] },
    { id: 'crs202', name: 'Physics', code: 'PHY202', teacher: 'Mr. Ken Adams', classes: ['SSS 1', 'SSS 3'] },
    { id: 'crs303', name: 'English Language', code: 'ENG101', teacher: 'Ms. Sarah Connor', classes: ['JSS 1', 'JSS 2', 'SSS 1'] },
    { id: 'crs404', name: 'Chemistry', code: 'CHE303', teacher: 'Dr. John Miller', classes: ['SSS 3'] },
];
// Mock teachers for assignment dropdown
const MOCK_TEACHERS = [
    { id: 't001', name: 'Mrs. Jane Doe' },
    { id: 't002', name: 'Mr. Ken Adams' },
    { id: 't003', name: 'Ms. Sarah Connor' },
    { id: 't004', name: 'Dr. John Miller' },
];
// Mock classes for assignment dropdown
const MOCK_CLASS_OPTIONS = ['JSS 1', 'JSS 2', 'SSS 1', 'SSS 2', 'SSS 3'];


const ManageCourses = () => {
    const [courses, setCourses] = useState(MOCK_COURSES);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // State for the Add/Edit Modal (0: closed, 1: Add, 2: Edit)
    const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentCourse: null });

    const filteredCourses = courses.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Placeholder CRUD Handlers (Replace with API calls)
    const handleAddOrEdit = (formData) => {
        setLoading(true);
        setMessage('');
        
        setTimeout(() => {
            if (modalState.mode === 'add') {
                const newCourse = { ...formData, id: 'crs' + Date.now() };
                setCourses(prev => [...prev, newCourse]);
                setMessage(`Course '${newCourse.name}' added successfully. (API simulation)`);
            } else {
                setCourses(prev => prev.map(c => 
                    c.id === formData.id ? { ...c, ...formData } : c
                ));
                setMessage(`Course '${formData.name}' updated successfully. (API simulation)`);
            }
            setLoading(false);
            setModalState({ isOpen: false, mode: 'add', currentCourse: null });
        }, 800);
    };

    const handleDelete = (courseId, courseName) => {
        if (window.confirm(`Are you sure you want to delete course: ${courseName}?`)) {
            setLoading(true);
            setMessage('');
            setTimeout(() => {
                setCourses(prev => prev.filter(c => c.id !== courseId));
                setMessage(`Course '${courseName}' deleted successfully. (API simulation)`);
                setLoading(false);
            }, 800);
        }
    };
    
    // Form component for Add/Edit Modal
    const CourseForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
        const [formData, setFormData] = useState({ 
            name: initialData?.name || '', 
            code: initialData?.code || '',
            teacher: initialData?.teacher || MOCK_TEACHERS[0].name,
            classes: initialData?.classes || [],
        });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };
        
        const handleClassChange = (e) => {
            const { options } = e.target;
            const value = [];
            for (let i = 0, l = options.length; i < l; i++) {
              if (options[i].selected) {
                value.push(options[i].value);
              }
            }
            setFormData({ ...formData, classes: value });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit({ ...initialData, ...formData });
        };

        return (
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Course Name</label>
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
                    <label className="form-label">Course Code</label>
                    <input 
                        type="text" 
                        className="form-control rounded-3" 
                        name="code" 
                        value={formData.code} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Assigned Teacher</label>
                    <select
                        className="form-select rounded-3"
                        name="teacher"
                        value={formData.teacher}
                        onChange={handleChange}
                        required
                    >
                        {MOCK_TEACHERS.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="form-label">Applicable Classes (Ctrl+Click to select multiple)</label>
                    <select
                        className="form-select rounded-3"
                        name="classes"
                        value={formData.classes}
                        onChange={handleClassChange}
                        multiple
                        required
                        size="4"
                    >
                        {MOCK_CLASS_OPTIONS.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (initialData ? 'Update Course' : 'Add Course')}
                    </button>
                </div>
            </form>
        );
    };


    return (
        <div className="card shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h4 className="card-title text-primary mb-0 d-flex align-items-center">
                    <BookMarked size={24} className="me-2" /> Manage Courses & Subjects
                </h4>
                <button 
                    className="btn btn-primary rounded-3 d-flex align-items-center"
                    onClick={() => setModalState({ isOpen: true, mode: 'add', currentCourse: null })}
                >
                    <PlusCircle size={20} className="me-2" /> Add New Course
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
                    placeholder="Search courses or codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Course Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Code</th>
                            <th scope="col">Teacher</th>
                            <th scope="col">Classes</th>
                            <th scope="col" className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((item) => (
                                <tr key={item.id}>
                                    <td className="fw-semibold">{item.name}</td>
                                    <td>{item.code}</td>
                                    <td>{item.teacher}</td>
                                    <td>
                                        {item.classes.map(cls => 
                                            <span key={cls} className="badge bg-secondary me-1">{cls}</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-secondary me-2 rounded-3"
                                            onClick={() => setModalState({ isOpen: true, mode: 'edit', currentCourse: item })}
                                            title="Edit Course"
                                            disabled={loading}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger rounded-3"
                                            onClick={() => handleDelete(item.id, item.name)}
                                            title="Delete Course"
                                            disabled={loading}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center text-muted">No courses found.</td>
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
                                <h5 className="modal-title">{modalState.mode === 'add' ? 'Add New Course' : 'Edit Course'}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentCourse: null })}></button>
                            </div>
                            <div className="modal-body">
                                <CourseForm 
                                    initialData={modalState.currentCourse} 
                                    onSubmit={handleAddOrEdit} 
                                    onCancel={() => setModalState({ isOpen: false, mode: 'add', currentCourse: null })}
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

export default ManageCourses;
