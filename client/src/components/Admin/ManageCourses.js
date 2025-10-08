import React, { useState, useMemo } from 'react';
import { BookMarked, Edit, Trash2, PlusCircle, Search, AlertTriangle } from 'lucide-react';

// Mock Data
const MOCK_COURSES = [
    { id: 'crs101', name: 'Mathematics', code: 'MAT101', teacher: 'Mrs. Jane Doe', classes: ['JSS 1', 'JSS 2'] },
    { id: 'crs202', name: 'Physics', code: 'PHY202', teacher: 'Mr. Ken Adams', classes: ['SSS 1', 'SSS 3'] },
    { id: 'crs303', name: 'English Language', code: 'ENG101', teacher: 'Ms. Sarah Connor', classes: ['JSS 1', 'JSS 2', 'SSS 1'] },
    { id: 'crs404', name: 'Chemistry', code: 'CHE303', teacher: 'Dr. John Miller', classes: ['SSS 3'] },
];

const MOCK_TEACHERS = [
    { id: 't001', name: 'Mrs. Jane Doe' },
    { id: 't002', name: 'Mr. Ken Adams' },
    { id: 't003', name: 'Ms. Sarah Connor' },
    { id: 't004', name: 'Dr. John Miller' },
];

const MOCK_CLASS_OPTIONS = ['JSS 1', 'JSS 2', 'SSS 1', 'SSS 2', 'SSS 3'];

const ManageCourses = () => {
    const [courses, setCourses] = useState(MOCK_COURSES);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentCourse: null });

    // --- Modal Helpers ---
    const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentCourse: null });
    const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentCourse: null });
    const openEditModal = (course) => setModalState({ isOpen: true, mode: 'edit', currentCourse: course });
    const openDeleteModal = (course) => setModalState({ isOpen: true, mode: 'delete', currentCourse: course });

    // Filter courses based on search
    const filteredCourses = useMemo(() =>
        courses.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
    , [courses, searchTerm]);

    // --- CRUD Handlers ---
    const handleAddOrEdit = (formData) => {
        setLoading(true);
        setMessage('');
        setTimeout(() => {
            if (modalState.mode === 'add') {
                const newCourse = { ...formData, id: 'crs' + Date.now() };
                setCourses(prev => [...prev, newCourse]);
                setMessage(`Course '${newCourse.name}' added successfully.`);
            } else {
                setCourses(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } : c));
                setMessage(`Course '${formData.name}' updated successfully.`);
            }
            setLoading(false);
            closeModal();
        }, 800);
    };

    const handleDeleteConfirmed = (courseId, courseName) => {
        setLoading(true);
        setMessage('');
        closeModal();
        setTimeout(() => {
            setCourses(prev => prev.filter(c => c.id !== courseId));
            setMessage(`Course '${courseName}' deleted successfully.`);
            setLoading(false);
        }, 800);
    };

    // --- Sub-components ---
    const CourseForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
        const [formData, setFormData] = useState({
            name: initialData?.name || '',
            code: initialData?.code || '',
            teacher: initialData?.teacher || MOCK_TEACHERS[0].name,
            classes: initialData?.classes || [],
        });

        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

        const handleClassChange = (e) => {
            const value = Array.from(e.target.selectedOptions, opt => opt.value);
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
                    <input type="text" className="form-control rounded-3" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Course Code</label>
                    <input type="text" className="form-control rounded-3" name="code" value={formData.code} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Assigned Teacher</label>
                    <select className="form-select rounded-3" name="teacher" value={formData.teacher} onChange={handleChange} required>
                        {MOCK_TEACHERS.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="form-label">Applicable Classes</label>
                    <select className="form-select rounded-3" multiple size="4" value={formData.classes} onChange={handleClassChange} required>
                        {MOCK_CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>{isSaving ? 'Saving...' : (initialData ? 'Update Course' : 'Add Course')}</button>
                </div>
            </form>
        );
    };

    const DeleteConfirmation = ({ course, onConfirm, onCancel, isDeleting }) => (
        <>
            <div className="alert alert-warning border-warning rounded-3 mb-4 d-flex align-items-center">
                <AlertTriangle size={24} className="me-3 text-warning flex-shrink-0" />
                <div>
                    Are you sure you want to delete the course: <strong>{course.name}</strong>? This action cannot be undone.
                </div>
            </div>
            <div className="d-flex justify-content-end">
                <button className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isDeleting}>Cancel</button>
                <button className="btn btn-danger rounded-3" onClick={() => onConfirm(course.id, course.name)} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
            </div>
        </>
    );

    const renderModalContent = () => {
        const { mode, currentCourse } = modalState;
        if (mode === 'add' || mode === 'edit') 
            return <CourseForm initialData={currentCourse} onSubmit={handleAddOrEdit} onCancel={closeModal} isSaving={loading} />;
        if (mode === 'delete') 
            return <DeleteConfirmation course={currentCourse} onConfirm={handleDeleteConfirmed} onCancel={closeModal} isDeleting={loading} />;
        return null;
    };

    return (
        <div className="card shadow-sm rounded-4 p-3 p-md-4 mb-4">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                <h4 className="card-title text-primary mb-3 mb-md-0 d-flex align-items-center">
                    <BookMarked size={24} className="me-2" /> Manage Courses & Subjects
                </h4>
                <button className="btn btn-primary rounded-3 d-flex align-items-center w-100 w-md-auto" onClick={openAddModal}>
                    <PlusCircle size={20} className="me-2" /> Add New Course
                </button>
            </div>

            {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">{message}</div>}

            {/* Search */}
            <div className="mb-4 col-12 col-md-4 p-0">
                <div className="input-group">
                    <span className="input-group-text bg-light rounded-start-3"><Search size={18} /></span>
                    <input type="text" className="form-control rounded-end-3" placeholder="Search courses or codes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Course Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle caption-top">
                    <caption>List of all managed courses</caption>
                    <thead className="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th className="d-none d-sm-table-cell">Teacher</th>
                            <th className="d-none d-lg-table-cell">Classes</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length > 0 ? filteredCourses.map(course => (
                            <tr key={course.id}>
                                <td className="fw-semibold">{course.name}</td>
                                <td>{course.code}</td>
                                <td className="d-none d-sm-table-cell">{course.teacher}</td>
                                <td className="d-none d-lg-table-cell">
                                    {course.classes.map(cls => <span key={cls} className="badge bg-secondary me-1 text-truncate" style={{ maxWidth: '80px' }}>{cls}</span>)}
                                </td>
                                <td className="text-center text-nowrap">
                                    <div className="d-flex justify-content-center flex-wrap">
                                        <button className="btn btn-sm btn-outline-secondary me-2 rounded-3" onClick={() => openEditModal(course)} disabled={loading}><Edit size={16} /></button>
                                        <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => openDeleteModal(course)} disabled={loading}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="5" className="text-center text-muted">No courses found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalState.isOpen && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content rounded-4 shadow-lg">
                            <div className="modal-header">
                                <h5 className="modal-title">{modalState.mode === 'add' ? 'Add New Course' : modalState.mode === 'edit' ? 'Edit Course' : 'Confirm Deletion'}</h5>
                                <button type="button" className="btn-close" onClick={closeModal} disabled={loading}></button>
                            </div>
                            <div className="modal-body">{renderModalContent()}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCourses;
