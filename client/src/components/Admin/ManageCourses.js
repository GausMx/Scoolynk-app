// src/components/Admin/ManageCourses.js - FIXED VERSION

import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Users, Edit, Trash2, PlusCircle, Search, Eye, Download } from 'lucide-react';
import axios from 'axios';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentCourse: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const API_BASE = `${REACT_APP_API_URL}/api/admin`;

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/courses`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Fetched courses:', res.data.courses);
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teachers`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Fetched teachers:', res.data.teachers);
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error('Failed to load teachers');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/classes`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Fetched classes:', res.data.classes);
      setClassOptions(res.data.classes || []);
    } catch (err) {
      console.error('Failed to load classes');
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    fetchClasses();
  }, []);

  const filteredCourses = useMemo(() =>
    courses.filter(
      c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.teacher?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [courses, searchTerm]);

  const getTeachersForCourse = (courseName) => {
    return teachers.filter(teacher => 
      teacher.courses && teacher.courses.includes(courseName)
    );
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Course Name', 'Primary Teacher', 'All Teachers', 'Classes'],
      ...courses.map(c => [
        c.name,
        c.teacher?.name || 'Not Assigned',
        getTeachersForCourse(c.name).map(t => t.name).join('; ') || 'None',
        c.classes?.map(cls => cls.name).join('; ') || 'None'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddOrEdit = async (formData) => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('Submitting form data:', formData);
      
      if (modalState.mode === 'add') {
        const res = await axios.post(`${API_BASE}/courses`, formData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Course created:', res.data);
        setMessage(`Course '${formData.name}' added successfully`);
      } else {
        const res = await axios.put(`${API_BASE}/courses/${formData._id}`, formData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Course updated:', res.data);
        setMessage(`Course '${formData.name}' updated successfully`);
      }
      
      await fetchCourses();
      await fetchTeachers(); // Refresh teachers to see updated courses
      closeModal();
    } catch (err) {
      console.error('Error saving course:', err);
      setMessage(err.response?.data?.message || 'Error saving course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async (courseId, courseName) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/courses/${courseId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      closeModal();
      setMessage(`Course '${courseName}' deleted successfully`);
      await fetchCourses();
      await fetchTeachers(); // Refresh teachers to see updated courses
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Error deleting course');
    } finally {
      setLoading(false);
    }
  };

  const CourseDetails = ({ course }) => {
    const teachersTeachingCourse = getTeachersForCourse(course.name);
    
    console.log('Course details:', course);
    console.log('Teachers teaching this course:', teachersTeachingCourse);
    
    return (
      <div className="p-3">
        <div className="mb-3">
          <strong className="text-primary small">Course Name:</strong>
          <p className="mb-0 fs-5">{course.name}</p>
        </div>

        <div className="mb-3">
          <strong className="text-primary small">Primary Assigned Teacher:</strong>
          <p className="mb-0">
            {course.teacher?.name || <span className="text-muted">Not assigned</span>}
          </p>
          {course.teacher && (
            <small className="text-muted">{course.teacher.email}</small>
          )}
        </div>

        <div className="mb-3">
          <strong className="text-primary small">All Teachers Teaching This Course:</strong>
          {teachersTeachingCourse.length > 0 ? (
            <ul className="list-group mt-2">
              {teachersTeachingCourse.map(teacher => (
                <li key={teacher._id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                  <div>
                    <strong className="small">{teacher.name}</strong>
                    <br />
                    <small className="text-muted">{teacher.email}</small>
                  </div>
                  <div>
                    {teacher.classes && teacher.classes.length > 0 && (
                      <div>
                        {teacher.classes.slice(0, 3).map(cls => (
                          <span key={cls._id} className="badge bg-info text-dark me-1 mb-1">
                            {cls.name}
                          </span>
                        ))}
                        {teacher.classes.length > 3 && (
                          <span className="badge bg-secondary">+{teacher.classes.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-2 small">No teachers assigned to this course yet.</p>
          )}
        </div>

        <div className="mb-3">
          <strong className="text-primary small">Applicable Classes:</strong>
          {course.classes && course.classes.length > 0 ? (
            <div className="mt-2">
              {course.classes.map(cls => (
                <span key={cls._id} className="badge bg-primary me-1 mb-1">
                  {cls.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted mt-2 small">No classes assigned.</p>
          )}
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-4">
          <button 
            className="btn btn-primary rounded-3 w-100 w-md-auto order-1"
            onClick={() => setModalState({ ...modalState, mode: 'edit' })}
          >
            <Edit size={16} className="me-1" />
            Edit Course
          </button>
          <button 
            className="btn btn-outline-secondary rounded-3 w-100 w-md-auto order-2"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const CourseForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      teacher: initialData?.teacher?._id || '',
      classes: initialData?.classes?.map(c => c._id) || [],
    });

    console.log('CourseForm initial data:', initialData);
    console.log('CourseForm state:', formData);

    const handleChange = (e) => {
      const { name, value } = e.target;
      console.log(`Field changed: ${name} = ${value}`);
      setFormData({ ...formData, [name]: value });
    };

    const handleClassChange = (e) => {
      const value = Array.from(e.target.selectedOptions, opt => opt.value);
      console.log('Classes selected:', value);
      setFormData({ ...formData, classes: value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // ✅ Ensure teacher is sent as empty string if not selected
      const submitData = {
        ...initialData,
        ...formData,
        teacher: formData.teacher || ''
      };
      
      console.log('Submitting course data:', submitData);
      console.log('Selected classes:', formData.classes);
      console.log('Selected teacher:', formData.teacher);
      
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Course Name *</label>
          <input 
            type="text" 
            className="form-control rounded-3" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g., Mathematics, English, Physics"
            required 
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label fw-semibold small">Primary Assigned Teacher</label>
          <select 
            className="form-select rounded-3" 
            name="teacher" 
            value={formData.teacher} 
            onChange={handleChange}
          >
            <option value="">-- Select Teacher (Optional) --</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <small className="text-muted">
            This is optional. Teachers can also be assigned during registration.
          </small>
        </div>
        
        <div className="mb-4">
          <label className="form-label fw-semibold small">
            Applicable Classes (Hold Ctrl/Cmd for multiple)
          </label>
          <select 
            className="form-select rounded-3" 
            multiple 
            size="5" 
            value={formData.classes} 
            onChange={handleClassChange}
          >
            {classOptions.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
          <small className="text-muted">
            Selected: {formData.classes.length} class(es)
          </small>
        </div>
        
        <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
          <button 
            type="button" 
            className="btn btn-outline-secondary rounded-3 w-100 w-md-auto order-2 order-md-1" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary rounded-3 w-100 w-md-auto order-1 order-md-2" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (initialData ? 'Update Course' : 'Add Course')}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirmation = ({ course, onConfirm, onCancel, isDeleting }) => {
    const teachersTeachingCourse = getTeachersForCourse(course.name);
    
    return (
      <>
        <div className="alert alert-warning d-flex align-items-start rounded-3 mb-3">
          <Trash2 size={20} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <strong className="small">Are you sure you want to delete "{course.name}"?</strong>
            <p className="mb-0 mt-2 small">This action cannot be undone.</p>
            {teachersTeachingCourse.length > 0 && (
              <p className="mb-0 mt-2 text-danger small">
                <strong>Warning:</strong> {teachersTeachingCourse.length} teacher(s) are currently teaching this course.
              </p>
            )}
            {course.classes && course.classes.length > 0 && (
              <p className="mb-0 mt-2 text-warning small">
                <strong>Note:</strong> This course is assigned to {course.classes.length} class(es).
              </p>
            )}
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
          <button 
            className="btn btn-outline-secondary rounded-3 w-100 w-md-auto order-2 order-md-1" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            className="btn btn-danger rounded-3 w-100 w-md-auto order-1 order-md-2" 
            onClick={() => onConfirm(course._id, course.name)} 
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </>
    );
  };

  const renderModalContent = () => {
    const { mode, currentCourse } = modalState;
    if (mode === 'view') return <CourseDetails course={currentCourse} />;
    if (mode === 'add' || mode === 'edit') return (
      <CourseForm 
        initialData={currentCourse} 
        onSubmit={handleAddOrEdit} 
        onCancel={closeModal} 
        isSaving={loading} 
      />
    );
    if (mode === 'delete') return (
      <DeleteConfirmation 
        course={currentCourse} 
        onConfirm={handleDeleteConfirmed} 
        onCancel={closeModal} 
        isDeleting={loading} 
      />
    );
    return null;
  };

  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentCourse: null });
  const openViewModal = (course) => setModalState({ isOpen: true, mode: 'view', currentCourse: course });
  const openEditModal = (course) => setModalState({ isOpen: true, mode: 'edit', currentCourse: course });
  const openDeleteModal = (course) => setModalState({ isOpen: true, mode: 'delete', currentCourse: course });
  const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentCourse: null });

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      <div className="card shadow-lg rounded-4 p-3 p-md-4 mb-4 border-0">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 border-bottom pb-3 gap-3">
          <div>
            <h4 className="fw-bold text-primary d-flex align-items-center mb-2 fs-5 fs-md-4">
              <BookOpen size={24} className="me-2" /> Manage Courses
            </h4>
            <p className="text-muted mb-0 small">Total: {courses.length} courses</p>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
            <button 
              className="btn btn-outline-success rounded-3 d-flex align-items-center justify-content-center"
              onClick={exportToCSV}
              disabled={courses.length === 0}
            >
              <Download size={18} className="me-2" /> <span className="small">Export</span>
            </button>
            <button 
              className="btn btn-primary rounded-3 d-flex align-items-center justify-content-center" 
              onClick={openAddModal}
            >
              <PlusCircle size={20} className="me-2" /> <span className="small">Add Course</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} rounded-3`}>
            <small>{message}</small>
          </div>
        )}

        {/* Stats Overview */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">Total Courses</h6>
                  <h3 className="fw-bold mb-0 fs-4 fs-md-3">{courses.length}</h3>
                </div>
                <BookOpen size={32} className="text-primary d-none d-md-block" />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">Total Teachers</h6>
                  <h3 className="fw-bold mb-0 fs-4 fs-md-3">{teachers.length}</h3>
                </div>
                <Users size={32} className="text-success d-none d-md-block" />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">With Teachers</h6>
                  <h3 className="fw-bold mb-0 fs-4 fs-md-3">
                    {courses.filter(c => c.teacher || getTeachersForCourse(c.name).length > 0).length}
                  </h3>
                </div>
                <Users size={32} className="text-info d-none d-md-block" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="row mb-4">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light rounded-start-pill border-0">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control rounded-end-pill"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading && courses.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover">
              <thead className="table-light">
                <tr>
                  <th className="small">#</th>
                  <th className="small">Course Name</th>
                  <th className="small d-none d-md-table-cell">Primary Teacher</th>
                  <th className="small d-none d-lg-table-cell">Classes</th>
                  <th className="text-center small">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
                  const teachersTeachingCourse = getTeachersForCourse(course.name);
                  
                  return (
                    <tr key={course._id}>
                      <td className="small">{index + 1}</td>
                      <td className="fw-semibold small">
                        {course.name}
                        <div className="d-md-none mt-1">
                          {course.teacher ? (
                            <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>
                              {course.teacher.name}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>No primary teacher</span>
                          )}
                          {teachersTeachingCourse.length > 0 && (
                            <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.7rem' }}>
                              {teachersTeachingCourse.length} teacher(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell small">
                        {course.teacher ? (
                          <span className="badge bg-success">
                            {course.teacher.name}
                          </span>
                        ) : (
                          <span className="text-muted">Not assigned</span>
                        )}
                        {teachersTeachingCourse.length > 0 && (
                          <div className="mt-1">
                            <small className="text-muted">
                              +{teachersTeachingCourse.length} teaching
                            </small>
                          </div>
                        )}
                      </td>
                      <td className="d-none d-lg-table-cell small">
                        {course.classes && course.classes.length > 0 ? (
                          <div>
                            {course.classes.slice(0, 3).map(cls => (
                              <span key={cls._id} className="badge bg-info text-dark me-1 mb-1">
                                {cls.name}
                              </span>
                            ))}
                            {course.classes.length > 3 && (
                              <span className="badge bg-secondary">
                                +{course.classes.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center flex-wrap">
                          <button 
                            className="btn btn-sm btn-outline-info rounded-3" 
                            onClick={() => openViewModal(course)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary rounded-3" 
                            onClick={() => openEditModal(course)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger rounded-3" 
                            onClick={() => openDeleteModal(course)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4 small">
                      {searchTerm ? `No courses found matching "${searchTerm}"` : 'No courses available. Click "Add Course" to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header">
                <h5 className="modal-title fw-bold fs-6">
                  {modalState.mode === 'add' && 'Add New Course'}
                  {modalState.mode === 'edit' && 'Edit Course'}
                  {modalState.mode === 'delete' && 'Delete Course'}
                  {modalState.mode === 'view' && 'Course Details'}
                </h5>
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