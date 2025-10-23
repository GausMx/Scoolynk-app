// src/components/Admin/ManageClasses.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Edit, Trash2, PlusCircle, Users, DollarSign, Eye, Download, TrendingUp } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentClass: null });

  const API_BASE = `${REACT_APP_API_URL}/api/admin`;
  const token = localStorage.getItem('token');

  // Fetch Classes with student counts
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const [classRes, studentRes, courseRes] = await Promise.all([
        axios.get(`${API_BASE}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const classList = classRes.data.classes || [];
      const studentList = studentRes.data.students || [];
      const courseList = courseRes.data.courses || [];

      // Add student count and courses to each class
      const enrichedClasses = classList.map(cls => {
        const classStudents = studentList.filter(s => s.classId?._id === cls._id);
        const classCourses = courseList.filter(c => c.classes?.some(cl => cl._id === cls._id));
        
        return {
          ...cls,
          studentCount: classStudents.length,
          courses: classCourses
        };
      });

      setClasses(enrichedClasses);
      setStudents(studentList);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentClass: null });
  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentClass: null });
  const openViewModal = (cls) => setModalState({ isOpen: true, mode: 'view', currentClass: cls });
  const openEditModal = (cls) => setModalState({ isOpen: true, mode: 'edit', currentClass: cls });
  const openDeleteModal = (cls) => setModalState({ isOpen: true, mode: 'delete', currentClass: cls });

  // CRUD Handlers
  const handleAddOrEdit = async (formData) => {
    try {
      setLoading(true);
      setMessage('');
      if (modalState.mode === 'add') {
        await axios.post(`${API_BASE}/classes`, formData, { headers: { Authorization: `Bearer ${token}` } });
        setMessage(`Class '${formData.name}' added successfully`);
      } else {
        await axios.put(`${API_BASE}/classes/${formData._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        setMessage(`Class '${formData.name}' updated successfully`);
      }
      await fetchClasses();
      closeModal();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Error saving class');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async (classId, className) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/classes/${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      closeModal();
      setMessage(`Class '${className}' deleted successfully`);
      await fetchClasses();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Error deleting class');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Class Name', 'Fee (₦)', 'Students', 'Courses'],
      ...classes.map(c => [
        c.name,
        c.fee,
        c.studentCount,
        c.courses?.length || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // View Details Component
  const ClassDetails = ({ cls }) => (
    <div className="p-3">
      <div className="row mb-3">
        <div className="col-md-6">
          <strong className="text-primary">Class Name:</strong>
          <p className="fs-5 mb-0">{cls.name}</p>
        </div>
        <div className="col-md-6">
          <strong className="text-primary">Class Fee:</strong>
          <p className="fs-5 mb-0">₦{cls.fee?.toLocaleString()}</p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <strong className="text-primary">Total Students:</strong>
          <p className="fs-4 mb-0 text-success">{cls.studentCount}</p>
        </div>
        <div className="col-md-6">
          <strong className="text-primary">Total Courses:</strong>
          <p className="fs-4 mb-0 text-info">{cls.courses?.length || 0}</p>
        </div>
      </div>

      <div className="mb-3">
        <strong className="text-primary">Courses in This Class:</strong>
        {cls.courses && cls.courses.length > 0 ? (
          <ul className="list-group mt-2">
            {cls.courses.map(course => (
              <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{course.name}</span>
                <span className="badge bg-primary">
                  {course.teacher?.name || 'No Teacher'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-2">No courses assigned to this class yet.</p>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button 
          className="btn btn-primary rounded-3"
          onClick={() => setModalState({ ...modalState, mode: 'edit' })}
        >
          <Edit size={16} className="me-1" />
          Edit Class
        </button>
        <button 
          className="btn btn-outline-secondary rounded-3"
          onClick={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  );

  // Forms
  const ClassForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      fee: initialData?.fee || 0,
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ ...initialData, ...formData, fee: parseFloat(formData.fee) || 0 });
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Class Name *</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className="form-control rounded-3" 
            placeholder="e.g., JSS1, SSS2"
            required 
          />
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold">Class Fee (₦) *</label>
          <input 
            type="number" 
            name="fee" 
            value={formData.fee} 
            onChange={handleChange} 
            className="form-control rounded-3" 
            min="0"
            placeholder="0"
            required 
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary rounded-3" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
            {isSaving ? 'Saving...' : (initialData ? 'Update Class' : 'Add Class')}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirmation = ({ cls, onConfirm, onCancel, isDeleting }) => (
    <>
      <div className="alert alert-warning d-flex align-items-start rounded-3">
        <Trash2 size={20} className="me-2 mt-1" />
        <div>
          <strong>Delete "{cls.name}"?</strong>
          <p className="mb-0 mt-2">This action cannot be undone.</p>
          {cls.studentCount > 0 && (
            <p className="mb-0 mt-2 text-danger">
              <strong>Warning:</strong> This class has {cls.studentCount} student(s).
            </p>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-secondary rounded-3" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </button>
        <button className="btn btn-danger rounded-3" onClick={() => onConfirm(cls._id, cls.name)} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </>
  );

  const renderModalContent = () => {
    const { mode, currentClass } = modalState;
    if (mode === 'view') return <ClassDetails cls={currentClass} />;
    if (mode === 'add' || mode === 'edit') return <ClassForm initialData={currentClass} onSubmit={handleAddOrEdit} onCancel={closeModal} isSaving={loading} />;
    if (mode === 'delete') return <DeleteConfirmation cls={currentClass} onConfirm={handleDeleteConfirmed} onCancel={closeModal} isDeleting={loading} />;
    return null;
  };

  // Calculate stats
  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0);
  const totalRevenue = classes.reduce((sum, cls) => sum + (cls.fee * cls.studentCount), 0);
  const avgStudentsPerClass = classes.length > 0 ? (totalStudents / classes.length).toFixed(1) : 0;

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
          <div>
            <h4 className="fw-bold text-primary d-flex align-items-center mb-2">
              <BookOpen size={28} className="me-2" /> Manage Classes
            </h4>
            <p className="text-muted mb-0">Total: {classes.length} classes</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button 
              className="btn btn-outline-success rounded-3 d-flex align-items-center"
              onClick={exportToCSV}
              disabled={classes.length === 0}
            >
              <Download size={18} className="me-2" /> Export
            </button>
            <button className="btn btn-primary rounded-3 d-flex align-items-center" onClick={openAddModal}>
              <PlusCircle size={20} className="me-2" /> Add Class
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} rounded-3`}>
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Classes</h6>
                  <h3 className="mb-0">{classes.length}</h3>
                </div>
                <BookOpen size={40} />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Students</h6>
                  <h3 className="mb-0">{totalStudents}</h3>
                </div>
                <Users size={40} />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Avg per Class</h6>
                  <h3 className="mb-0">{avgStudentsPerClass}</h3>
                </div>
                <TrendingUp size={40} />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Revenue</h6>
                  <h3 className="mb-0">₦{(totalRevenue / 1000000).toFixed(1)}M</h3>
                </div>
                <DollarSign size={40} />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading && classes.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Class Name</th>
                  <th>Fee (₦)</th>
                  <th>Students</th>
                  <th>Courses</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length > 0 ? classes.map((cls, index) => (
                  <tr key={cls._id}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold">{cls.name}</td>
                    <td>₦{cls.fee?.toLocaleString()}</td>
                    <td>
                      <span className="badge bg-success">{cls.studentCount}</span>
                    </td>
                    <td>
                      <span className="badge bg-info">{cls.courses?.length || 0}</span>
                    </td>
                    <td className="text-center">
                      <button 
                        className="btn btn-sm btn-outline-info me-1 rounded-3" 
                        onClick={() => openViewModal(cls)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-primary me-1 rounded-3" 
                        onClick={() => openEditModal(cls)} 
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger rounded-3" 
                        onClick={() => openDeleteModal(cls)} 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No classes found. Click "Add Class" to get started.
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
                <h5 className="modal-title fw-bold">
                  {modalState.mode === 'add' && 'Add New Class'}
                  {modalState.mode === 'edit' && 'Edit Class'}
                  {modalState.mode === 'delete' && 'Delete Class'}
                  {modalState.mode === 'view' && 'Class Details'}
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

export default ManageClasses;