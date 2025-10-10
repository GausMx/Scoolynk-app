import React, { useState } from 'react';
import { BookOpen, Edit, Trash2, PlusCircle } from 'lucide-react';
import  Chart  from 'react-apexcharts';


// Mock data
const MOCK_CLASSES = [
  { id: 'c001', name: 'JSS 1', studentCount: 40 },
  { id: 'c002', name: 'JSS 2', studentCount: 38 },
  { id: 'c003', name: 'SSS 1', studentCount: 50 },
  { id: 'c004', name: 'SSS 3', studentCount: 30 },
];

const ManageClasses = () => {
  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentClass: null });

  // Helpers
  const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentClass: null });
  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentClass: null });
  const openEditModal = (cls) => setModalState({ isOpen: true, mode: 'edit', currentClass: cls });
  const openDeleteModal = (cls) => setModalState({ isOpen: true, mode: 'delete', currentClass: cls });

  // CRUD handlers
  const handleAddOrEdit = (formData) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      if (modalState.mode === 'add') {
        const newClass = { ...formData, id: 'c' + Date.now(), studentCount: 0 };
        setClasses(prev => [...prev, newClass]);
        setMessage(`Class '${newClass.name}' added.`);
      } else {
        setClasses(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } : c));
        setMessage(`Class '${formData.name}' updated.`);
      }
      setLoading(false);
      closeModal();
    }, 500);
  };

  const handleDeleteConfirmed = (classId, className) => {
    setLoading(true);
    closeModal();
    setTimeout(() => {
      setClasses(prev => prev.filter(c => c.id !== classId));
      setMessage(`Class '${className}' deleted.`);
      setLoading(false);
    }, 500);
  };

  // Subcomponent: form for add/edit
  const ClassForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
    });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ ...initialData, ...formData });
    };
    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Class Name</label>
          <input
            type="text"
            className="form-control rounded-3"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-secondary me-2 rounded-3"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialData ? 'Update' : 'Add Class'}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirmation = ({ cls, onConfirm, onCancel, isDeleting }) => (
    <>
      <div className="alert alert-warning d-flex align-items-center rounded-3 mb-4">
        <Trash2 size={24} className="me-3 text-warning" />
        <div>Delete <strong>{cls.name}</strong>? This cannot be reversed.</div>
      </div>
      <div className="d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-secondary me-2 rounded-3"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger rounded-3"
          onClick={() => onConfirm(cls.id, cls.name)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </>
  );

  const renderModalContent = () => {
    const { mode, currentClass } = modalState;
    if (mode === 'add' || mode === 'edit') {
      return (
        <ClassForm
          initialData={currentClass}
          onSubmit={handleAddOrEdit}
          onCancel={closeModal}
          isSaving={loading}
        />
      );
    }
    if (mode === 'delete') {
      return (
        <DeleteConfirmation
          cls={currentClass}
          onConfirm={handleDeleteConfirmed}
          onCancel={closeModal}
          isDeleting={loading}
        />
      );
    }
    return null;
  };

  // Some class-level metrics
  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0);

  // Mini chart showing distribution of student counts among classes
  const chartOptions = {
    chart: {
      type: 'bar',
      height: 150,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: classes.map(c => c.name),
    },
  };
  const chartSeries = [
    {
      name: 'Students',
      data: classes.map(c => c.studentCount),
    },
  ];

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h3 className="fw-bold text-primary">Manage Classes</h3>
      </div>

      {/* Top metrics + mini chart */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm rounded-4 p-3 text-center">
            <h6 className="text-muted mb-1">Total Classes</h6>
            <h4 className="fw-bold">{classes.length}</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm rounded-4 p-3 text-center">
            <h6 className="text-muted mb-1">Total Students</h6>
            <h4 className="fw-bold">{totalStudents}</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm rounded-4 p-3">
            <h6 className="text-muted mb-1">Class Sizes</h6>
            <Chart options={chartOptions} series={chartSeries} type="bar" />
          </div>
        </div>
      </div>

      <div className="card shadow-lg rounded-4 p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="mb-0 d-flex align-items-center">
            <BookOpen className="me-2" size={24} /> Classes
          </h5>
          <button className="btn btn-primary rounded-3" onClick={openAddModal} disabled={loading}>
            <PlusCircle size={20} className="me-2" /> Add Class
          </button>
        </div>

        {message && (
          <div className={`alert ${message.includes('deleted') ? 'alert-danger' : 'alert-success'} rounded-3`} role="alert">
            {message}
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Class Name</th>
                <th>Students</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length > 0 ? (
                classes.map(cls => (
                  <tr key={cls.id}>
                    <td>{cls.name}</td>
                    <td>{cls.studentCount}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEditModal(cls)}
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openDeleteModal(cls)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center text-muted py-3">
                    No classes to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalState.mode === 'add' && 'Add Class'}
                    {modalState.mode === 'edit' && 'Edit Class'}
                    {modalState.mode === 'delete' && 'Delete Class'}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={loading}></button>
                </div>
                <div className="modal-body">{renderModalContent()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClasses;
