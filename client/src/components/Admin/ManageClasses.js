import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Edit, Trash2, PlusCircle, Save, X } from 'lucide-react';
import Chart from 'react-apexcharts';
const { REACT_APP_API_URL } = process.env;

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentClass: null });

  const API_BASE = `${REACT_APP_API_URL}/api/admin`;
  const token = localStorage.getItem('token');

  // ---------- Fetch Classes ----------
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/classes`, { headers: { Authorization: `Bearer ${token}` } });
      const classList = res.data.classes || res.data || [];

      // Fetch courses for each class
      const withCourses = await Promise.all(
        classList.map(async (cls) => {
          try {
            const courseRes = await axios.get(`${API_BASE}/classes/${cls._id}/courses`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { ...cls, courses: courseRes.data.courses || [] };
          } catch {
            return { ...cls, courses: [] };
          }
        })
      );

      setClasses(withCourses);
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
  const openEditModal = (cls) => setModalState({ isOpen: true, mode: 'edit', currentClass: cls });
  const openDeleteModal = (cls) => setModalState({ isOpen: true, mode: 'delete', currentClass: cls });

  // ---------- CRUD Handlers ----------
  const handleAddOrEdit = async (formData) => {
    try {
      setLoading(true);
      setMessage('');
      if (modalState.mode === 'add') {
        await axios.post(`${API_BASE}/classes`, formData, { headers: { Authorization: `Bearer ${token}` } });
        setMessage(`Class '${formData.name}' added`);
      } else {
        await axios.put(`${API_BASE}/classes/${formData._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        setMessage(`Class '${formData.name}' updated`);
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
      setMessage(`Class '${className}' deleted`);
      await fetchClasses();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Error deleting class');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Course Edit Handlers ----------
  const handleCourseEdit = (classId, course) => setEditingCourse({ classId, ...course });
  const handleCourseCancel = () => setEditingCourse(null);

  const handleCourseSave = async (classId, courseId, updatedName) => {
    try {
      await axios.put(
        `${API_BASE}/classes/${classId}/courses/${courseId}`,
        { name: updatedName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Course updated successfully');
      await fetchClasses();
      setEditingCourse(null);
    } catch (err) {
      console.error(err);
      setMessage('Error updating course');
    }
  };

  // ---------- Forms ----------
  const ClassForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      fee: initialData?.fee || 0,
      schoolId: initialData?.schoolId || '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ ...initialData, ...formData, fee: parseFloat(formData.fee) || 0 });
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Class Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Fee (₦)</label>
          <input type="number" name="fee" value={formData.fee} onChange={handleChange} className="form-control" min="0" required />
        </div>
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialData ? 'Update' : 'Add Class'}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirmation = ({ cls, onConfirm, onCancel, isDeleting }) => (
    <>
      <div className="alert alert-warning">Delete <strong>{cls.name}</strong>? This cannot be reversed.</div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-secondary me-2" onClick={onCancel} disabled={isDeleting}>Cancel</button>
        <button className="btn btn-danger" onClick={() => onConfirm(cls._id, cls.name)} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </>
  );

  const renderModalContent = () => {
    const { mode, currentClass } = modalState;
    if (mode === 'add' || mode === 'edit') return <ClassForm initialData={currentClass} onSubmit={handleAddOrEdit} onCancel={closeModal} isSaving={loading} />;
    if (mode === 'delete') return <DeleteConfirmation cls={currentClass} onConfirm={handleDeleteConfirmed} onCancel={closeModal} isDeleting={loading} />;
    return null;
  };

  const chartOptions = {
    chart: { id: 'class-fee-chart' },
    xaxis: { categories: classes.map((c) => c.name) },
    title: { text: 'Class Fees Overview', align: 'center' },
  };

  const chartSeries = [{ name: 'Fee (₦)', data: classes.map((c) => c.fee) }];

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3><BookOpen size={24} className="me-2" />Manage Classes</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          <PlusCircle size={20} className="me-1" /> Add Class
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="table-responsive mb-4">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Fee (₦)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <React.Fragment key={cls._id}>
                <tr>
                  <td>{cls.name}</td>
                  <td>{cls.fee}</td>
                  <td>
                    <button className="btn btn-sm btn-primary me-2" onClick={() => openEditModal(cls)} title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(cls)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
                {cls.courses?.length > 0 && (
                  <tr>
                    <td colSpan="3">
                      <div className="p-2 border rounded bg-light">
                        <strong>Courses:</strong>
                        <ul className="list-group mt-2">
                          {cls.courses.map((course) => (
                            <li key={course._id} className="list-group-item d-flex justify-content-between align-items-center">
                              {editingCourse?.courseId === course._id ? (
                                <div className="d-flex w-100">
                                  <input
                                    type="text"
                                    className="form-control me-2"
                                    defaultValue={course.name}
                                    onChange={(e) => (editingCourse.name = e.target.value)}
                                  />
                                  <button
                                    className="btn btn-success btn-sm me-2"
                                    onClick={() =>
                                      handleCourseSave(cls._id, course._id, editingCourse.name)
                                    }
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button className="btn btn-secondary btn-sm" onClick={handleCourseCancel}>
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {course.name}
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                      handleCourseEdit(cls._id, { courseId: course._id, name: course.name })
                                    }
                                  >
                                    Edit
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center">No classes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {classes.length > 0 && (
        <div className="mb-4">
          <Chart options={chartOptions} series={chartSeries} type="bar" height={300} />
        </div>
      )}

      {modalState.isOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalState.mode === 'add'
                    ? 'Add Class'
                    : modalState.mode === 'edit'
                    ? 'Edit Class'
                    : 'Delete Class'}
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
