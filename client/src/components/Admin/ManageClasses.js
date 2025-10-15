import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Edit, Trash2, PlusCircle } from 'lucide-react';
import Chart from 'react-apexcharts';
const { REACT_APP_API_URL } = process.env;
const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentClass: null });

  const API_BASE = `${REACT_APP_API_URL}/api/admin`;
  const token = localStorage.getItem('token');

  const fetchClasses = async () => {
    try { 
      setLoading(true);
      const res = await axios.get(`${API_BASE}/classes`, { headers: { Authorization: `Bearer ${token}` } });
      setClasses(res.data.classes || res.data || []);
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
        await axios.put(`${API_BASE}/classes/${formData.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
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
      closeModal();
      await axios.delete(`${API_BASE}/classes/${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(`Class '${className}' deleted`);
      await fetchClasses();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Error deleting class');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Class Form ----------
  const ClassForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      fee: initialData?.fee || 0,
      schoolId: initialData?.schoolId || '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ ...initialData, ...formData, fee: parseFloat(formData.fee) });
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
          <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : initialData ? 'Update' : 'Add Class'}</button>
        </div>
      </form>
    );
  };

  // ---------- Delete Confirmation ----------
  const DeleteConfirmation = ({ cls, onConfirm, onCancel, isDeleting }) => (
    <>
      <div className="alert alert-warning">Delete <strong>{cls.name}</strong>? This cannot be reversed.</div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-secondary me-2" onClick={onCancel} disabled={isDeleting}>Cancel</button>
        <button className="btn btn-danger" onClick={() => onConfirm(cls.id, cls.name)} disabled={isDeleting}>
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

  // ---------- ApexCharts Data ----------
  const chartOptions = {
    chart: { id: 'class-fee-chart' },
    xaxis: { categories: classes.map(c => c.name) },
    title: { text: 'Class Fees Overview', align: 'center' }
  };

  const chartSeries = [
    {
      name: 'Fee (₦)',
      data: classes.map(c => c.fee)
    }
  ];

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3><BookOpen size={24} className="me-2" />Manage Classes</h3>
        <button className="btn btn-success" onClick={openAddModal}><PlusCircle size={20} className="me-1" /> Add Class</button>
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
              <tr key={cls._id}>
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
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center">No classes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Chart */}
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
                <h5 className="modal-title">{modalState.mode === 'add' ? 'Add Class' : modalState.mode === 'edit' ? 'Edit Class' : 'Delete Class'}</h5>
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
