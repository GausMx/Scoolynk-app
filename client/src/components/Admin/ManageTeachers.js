// src/components/Admin/ManageTeachers.js - MOBILE RESPONSIVE VERSION

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Search, UserPlus, Mail, Phone, BookOpen } from 'lucide-react';
import axios from 'axios';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'view', currentTeacher: null });

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchTeachers();
    fetchClassesAndCourses();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/teachers`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setMessage('Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesAndCourses = async () => {
    try {
      const [classesRes, coursesRes] = await Promise.all([
        axios.get(`${REACT_APP_API_URL}/api/admin/classes`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`${REACT_APP_API_URL}/api/admin/courses`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);
      setClasses(classesRes.data.classes || []);
      setCourses(coursesRes.data.courses || []);
    } catch (err) {
      console.error('Failed to fetch classes/courses:', err);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = async (formData) => {
    try {
      setLoading(true);
      setMessage('');
      
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/teachers/${formData._id}`,
        {
          classes: formData.classes,
          courses: formData.courses,
          classTeacherFor: formData.classTeacherFor
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setMessage(`Teacher '${formData.name}' updated successfully.`);
      await fetchTeachers();
      setModalState({ isOpen: false, mode: 'view', currentTeacher: null });
    } catch (err) {
      console.error('Failed to update teacher:', err);
      setMessage(err.response?.data?.message || 'Failed to update teacher.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete teacher: ${teacherName}?`)) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      await axios.delete(`${REACT_APP_API_URL}/api/admin/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setMessage(`Teacher '${teacherName}' deleted successfully.`);
      await fetchTeachers();
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      setMessage(err.response?.data?.message || 'Failed to delete teacher.');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (teacher) => {
    setModalState({ isOpen: true, mode: 'view', currentTeacher: teacher });
  };

  const openEditModal = (teacher) => {
    setModalState({ isOpen: true, mode: 'edit', currentTeacher: teacher });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'view', currentTeacher: null });
  };

  const TeacherDetails = ({ teacher }) => {
    return (
      <div className="p-3">
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <strong className="small">Name:</strong>
            <p className="mb-0">{teacher.name}</p>
          </div>
          <div className="col-12 col-md-6">
            <strong className="small">Email:</strong>
            <p className="mb-0"><Mail size={16} className="me-1" />{teacher.email}</p>
          </div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <strong className="small">Phone:</strong>
            <p className="mb-0"><Phone size={16} className="me-1" />{teacher.phone}</p>
          </div>
          <div className="col-12 col-md-6">
            <strong className="small">Role:</strong>
            <p className="mb-0"><span className="badge bg-info">{teacher.role}</span></p>
          </div>
        </div>
        <div className="mb-3">
          <strong className="small">Classes Teaching:</strong>
          <div className="mt-2">
            {teacher.classes && teacher.classes.length > 0 ? (
              teacher.classes.map(cls => (
                <span key={cls._id} className="badge bg-primary me-1 mb-1">
                  {cls.name}
                </span>
              ))
            ) : (
              <span className="text-muted small">No classes assigned</span>
            )}
          </div>
        </div>
        <div className="mb-3">
          <strong className="small">Courses Teaching:</strong>
          <div className="mt-2">
            {teacher.courses && teacher.courses.length > 0 ? (
              teacher.courses.map((course, idx) => (
                <span key={idx} className="badge bg-success me-1 mb-1">
                  {course}
                </span>
              ))
            ) : (
              <span className="text-muted small">No courses assigned</span>
            )}
          </div>
        </div>
        <div className="mb-3">
          <strong className="small">Class Teacher For:</strong>
          <div className="mt-2">
            {teacher.classTeacherFor && teacher.classTeacherFor.length > 0 ? (
              teacher.classTeacherFor.map(cls => (
                <span key={cls._id} className="badge bg-warning text-dark me-1 mb-1">
                  {cls.name}
                </span>
              ))
            ) : (
              <span className="text-muted small">Not a class teacher</span>
            )}
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-4">
          <button 
            className="btn btn-primary rounded-3 w-100 w-md-auto order-1"
            onClick={() => setModalState({ ...modalState, mode: 'edit' })}
          >
            <Edit size={16} className="me-1" />
            Edit Teacher
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

  const TeacherForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      _id: initialData?._id || '',
      name: initialData?.name || '',
      classes: initialData?.classes?.map(c => c._id) || [],
      courses: initialData?.courses || [],
      classTeacherFor: initialData?.classTeacherFor?.map(c => c._id) || [],
    });

    const handleMultiSelect = (e, fieldName) => {
      const selectedOptions = Array.from(e.target.selectedOptions, opt => opt.value);
      setFormData({ ...formData, [fieldName]: selectedOptions });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Teacher Name</label>
          <input 
            type="text" 
            className="form-control rounded-3" 
            value={formData.name} 
            disabled 
          />
          <small className="text-muted">Name cannot be changed from admin panel</small>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Classes Teaching (Hold Ctrl/Cmd for multiple)</label>
          <select
            multiple
            className="form-select rounded-3"
            size="5"
            value={formData.classes}
            onChange={(e) => handleMultiSelect(e, 'classes')}
          >
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
          <small className="text-muted">Selected: {formData.classes.length} class(es)</small>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Courses Teaching (Hold Ctrl/Cmd for multiple)</label>
          <select
            multiple
            className="form-select rounded-3"
            size="5"
            value={formData.courses}
            onChange={(e) => handleMultiSelect(e, 'courses')}
          >
            {courses.map(course => (
              <option key={course._id} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
          <small className="text-muted">Selected: {formData.courses.length} course(s)</small>
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold small">Class Teacher For (Hold Ctrl/Cmd for multiple)</label>
          <select
            multiple
            className="form-select rounded-3"
            size="5"
            value={formData.classTeacherFor}
            onChange={(e) => handleMultiSelect(e, 'classTeacherFor')}
          >
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
          <small className="text-muted">Selected: {formData.classTeacherFor.length} class(es)</small>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
          <button 
            type="button" 
            className="btn btn-secondary rounded-3 w-100 w-md-auto order-2 order-md-1" 
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      <div className="card shadow-lg rounded-4 p-3 p-md-4 mb-4 border-0">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 border-bottom pb-3 gap-3">
          <h4 className="card-title text-dark mb-0 d-flex align-items-center fw-bold fs-5 fs-md-4">
            <Users className="text-primary me-2" size={24} /> Manage Teachers
          </h4>
          <div className="badge bg-info fs-6">
            {teachers.length} Total Teachers
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} rounded-3`}>
            <small>{message}</small>
          </div>
        )}

        {/* Search */}
        <div className="input-group mb-4">
          <span className="input-group-text bg-light rounded-start-pill border-0">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-control rounded-end-pill"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="small">#</th>
                <th className="small">Name</th>
                <th className="d-none d-md-table-cell small">Email</th>
                <th className="d-none d-md-table-cell small">Phone</th>
                <th className="d-none d-lg-table-cell small">Classes</th>
                <th className="text-center small">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((t, index) => (
                  <tr key={t._id}>
                    <td className="small">{index + 1}</td>
                    <td className="fw-semibold small">
                      {t.name}
                      <div className="d-md-none mt-1">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{t.email}</small>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{t.phone}</small>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell small">{t.email}</td>
                    <td className="d-none d-md-table-cell small">{t.phone}</td>
                    <td className="d-none d-lg-table-cell">
                      {t.classes && t.classes.length > 0 ? (
                        <>
                          {t.classes.slice(0, 2).map(cls => (
                            <span key={cls._id} className="badge bg-secondary me-1 mb-1 text-truncate" style={{ maxWidth: '80px' }}>
                              {cls.name}
                            </span>
                          ))}
                          {t.classes.length > 2 && (
                            <span className="badge bg-secondary">+{t.classes.length - 2}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-info rounded-3"
                          onClick={() => openViewModal(t)}
                          disabled={loading}
                          title="View Details"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => openEditModal(t)}
                          disabled={loading}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => handleDelete(t._id, t.name)}
                          disabled={loading}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3 small">
                    {searchTerm ? `No teachers found matching "${searchTerm}"` : 'No teachers registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold fs-6">
                  {modalState.mode === 'view' ? 'Teacher Details' : 'Edit Teacher'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                {modalState.mode === 'view' ? (
                  <TeacherDetails teacher={modalState.currentTeacher} />
                ) : (
                  <TeacherForm
                    initialData={modalState.currentTeacher}
                    onSubmit={handleEdit}
                    onCancel={closeModal}
                    isSaving={loading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;