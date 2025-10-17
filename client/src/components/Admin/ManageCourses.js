import React, { useState, useMemo, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import API from '../../utils/api'; // ✅ Use centralized axios instance (with baseURL + token handling)

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentCourse: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ---------- Fetch Data ----------
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/courses');
      setCourses(res.data.courses || res.data || []);
    } catch (err) {
      console.error('[FetchCourses]', err);
      setMessage('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await API.get('/api/admin/teachers');
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error('[FetchTeachers]', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await API.get('/api/admin/classes');
      setClassOptions(res.data.classes || []);
    } catch (err) {
      console.error('[FetchClasses]', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    fetchClasses();
  }, []);

  // ---------- Search Filter ----------
  const filteredCourses = useMemo(() =>
    courses.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.teacher?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [courses, searchTerm]);

  // ---------- CRUD ----------
  const handleAddOrEdit = async (formData) => {
    try {
      setLoading(true);
      setMessage('');
      if (modalState.mode === 'add') {
        await API.post('/api/admin/courses', formData);
        setMessage(`Course '${formData.name}' added`);
      } else {
        await API.put(`/api/admin/courses/${formData._id}`, formData);
        setMessage(`Course '${formData.name}' updated`);
      }
      await fetchCourses();
      closeModal();
    } catch (err) {
      console.error('[Add/Edit Course]', err);
      setMessage(err.response?.data?.message || 'Error saving course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async (courseId, courseName) => {
    try {
      setLoading(true);
      await API.delete(`/api/admin/courses/${courseId}`);
      closeModal();
      setMessage(`Course '${courseName}' deleted`);
      await fetchCourses();
    } catch (err) {
      console.error('[Delete Course]', err);
      setMessage(err.response?.data?.message || 'Error deleting course');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Forms ----------
  const CourseForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      teacher: initialData?.teacher?._id || '',
      classes: initialData?.classes?.map(c => c._id) || [],
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
            <option value="">-- Select Teacher --</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold">Applicable Classes</label>
          <select className="form-select rounded-3" multiple size="4" value={formData.classes} onChange={handleClassChange}>
            {classOptions.map(cls => <option key={cls._id} value={cls._id}>{cls.name}</option>)}
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
        <button className="btn btn-danger rounded-3" onClick={() => onConfirm(course._id, course.name)} disabled={isDeleting}>
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

  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentCourse: null });
  const openEditModal = (course) => setModalState({ isOpen: true, mode: 'edit', currentCourse: course });
  const openDeleteModal = (course) => setModalState({ isOpen: true, mode: 'delete', currentCourse: course });
  const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentCourse: null });

  // ---------- UI ----------
  return (
    <div className="card shadow-sm rounded-4 p-4 mb-4 bg-white">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
        <h4 className="fw-bold text-primary d-flex align-items-center mb-3 mb-md-0">
          <i className="bi bi-journal-bookmark-fill me-2"></i> Manage Courses
        </h4>
        <button
          className="btn btn-primary rounded-3 d-flex align-items-center px-3 py-2"
          style={{ fontSize: '0.9rem', width: 'auto', whiteSpace: 'nowrap' }}
          onClick={openAddModal}
        >
          <i className="bi bi-plus-circle me-2"></i> Add Course
        </button>
      </div>

      {/* Overview */}
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
                <h5 className="fw-bold mb-0">{new Set(courses.map(c => c.teacher?.name)).size}</h5>
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
                <h5 className="fw-bold mb-0">{new Set(courses.flatMap(c => c.classes?.map(cl => cl.name))).size}</h5>
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
              <tr key={course._id}>
                <td className="fw-semibold">{course.name}</td>
                <td>{course.teacher?.name || '—'}</td>
                <td>
                  {course.classes?.map(cls => (
                    <span key={cls._id || cls} className="badge bg-secondary me-1">{cls.name || cls}</span>
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
              <div className="modal-body">{renderModalContent()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
