import React, { useState, useMemo } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MOCK_COURSES = [
  { id: 'crs101', name: 'Mathematics', teacher: 'Mrs. Jane Doe', classes: ['JSS 1', 'JSS 2'] },
  { id: 'crs202', name: 'Physics', teacher: 'Mr. Ken Adams', classes: ['SSS 1', 'SSS 3'] },
  { id: 'crs303', name: 'English Language', teacher: 'Ms. Sarah Connor', classes: ['JSS 1', 'SSS 1'] },
  { id: 'crs404', name: 'Chemistry', teacher: 'Dr. John Miller', classes: ['SSS 3'] },
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
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentCourse: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentCourse: null });
  const openEditModal = (course) => setModalState({ isOpen: true, mode: 'edit', currentCourse: course });
  const openDeleteModal = (course) => setModalState({ isOpen: true, mode: 'delete', currentCourse: course });
  const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentCourse: null });

  const filteredCourses = useMemo(() =>
    courses.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    ), [courses, searchTerm]);

  const handleAddOrEdit = (formData) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      if (modalState.mode === 'add') {
        const newCourse = { ...formData, id: 'crs' + Date.now() };
        setCourses(prev => [...prev, newCourse]);
        setMessage(`✅ '${newCourse.name}' added successfully.`);
      } else {
        setCourses(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } : c));
        setMessage(`✅ '${formData.name}' updated successfully.`);
      }
      setLoading(false);
      closeModal();
    }, 700);
  };

  const handleDeleteConfirmed = (courseId, courseName) => {
    setLoading(true);
    closeModal();
    setTimeout(() => {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setMessage(`🗑️ '${courseName}' deleted.`);
      setLoading(false);
    }, 700);
  };

  const CourseForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
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
          <label className="form-label fw-semibold">Course Name</label>
          <input type="text" className="form-control rounded-3" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Assigned Teacher</label>
          <select className="form-select rounded-3" name="teacher" value={formData.teacher} onChange={handleChange}>
            {MOCK_TEACHERS.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold">Applicable Classes</label>
          <select className="form-select rounded-3" multiple size="4" value={formData.classes} onChange={handleClassChange}>
            {MOCK_CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="text-end">
          <button type="button" className="btn btn-outline-secondary me-2 rounded-3" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
            {isSaving ? 'Saving...' : (initialData ? 'Update Course' : 'Add Course')}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirmation = ({ course, onConfirm, onCancel, isDeleting }) => (
    <>
      <div className="alert alert-warning d-flex align-items-center rounded-3 mb-3">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        <div>Are you sure you want to delete <strong>{course.name}</strong>? This cannot be undone.</div>
      </div>
      <div className="text-end">
        <button className="btn btn-outline-secondary me-2 rounded-3" onClick={onCancel}>Cancel</button>
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
    <div className="card shadow-sm rounded-4 p-4 mb-4 bg-white">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
        <h4 className="fw-bold text-primary d-flex align-items-center mb-3 mb-md-0">
          <i className="bi bi-journal-bookmark-fill me-2"></i> Manage Courses
        </h4>
        <button className="btn btn-primary rounded-3 d-flex align-items-center" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-2"></i> Add Course
        </button>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Total Courses</h6>
                <h5 className="fw-bold mb-0">{courses.length}</h5>
              </div>
              <i className="bi bi-journal-richtext fs-3 text-primary"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Teachers Assigned</h6>
                <h5 className="fw-bold mb-0">{new Set(courses.map(c => c.teacher)).size}</h5>
              </div>
              <i className="bi bi-person-workspace fs-3 text-success"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Classes Covered</h6>
                <h5 className="fw-bold mb-0">{new Set(courses.flatMap(c => c.classes)).size}</h5>
              </div>
              <i className="bi bi-mortarboard-fill fs-3 text-info"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table align-middle table-hover caption-top">
          <caption>List of all available courses</caption>
          <thead className="table-light">
            <tr>
              <th>Course Name</th>
              <th>Teacher</th>
              <th>Classes</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? filteredCourses.map(course => (
              <tr key={course.id}>
                <td className="fw-semibold">{course.name}</td>
                <td>{course.teacher}</td>
                <td>
                  {course.classes.map(cls => (
                    <span key={cls} className="badge bg-secondary me-1">{cls}</span>
                  ))}
                </td>
                <td className="text-center">
                  <button className="btn btn-sm btn-outline-primary me-2 rounded-3" onClick={() => openEditModal(course)}>
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => openDeleteModal(course)}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="text-center text-muted">No courses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalState.mode === 'add' ? 'Add New Course' :
                   modalState.mode === 'edit' ? 'Edit Course' : 'Delete Course'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {renderModalContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
