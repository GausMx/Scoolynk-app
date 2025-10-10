import React, { useState, useMemo } from 'react';
import { BookOpen, Edit, Trash2, PlusCircle, Search, AlertTriangle } from 'lucide-react';

const MOCK_CLASSES = [
  { id: 'c001', name: 'JSS 1', maxCapacity: 45, studentCount: 40 },
  { id: 'c002', name: 'JSS 2', maxCapacity: 40, studentCount: 38 },
  { id: 'c003', name: 'SSS 1', maxCapacity: 50, studentCount: 50 },
  { id: 'c004', name: 'SSS 3', maxCapacity: 35, studentCount: 30 },
];

const ManageClasses = () => {
  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentClass: null });

  const closeModal = () => setModalState({ isOpen: false, mode: 'add', currentClass: null });
  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentClass: null });
  const openEditModal = (cls) => setModalState({ isOpen: true, mode: 'edit', currentClass: cls });
  const openDeleteModal = (cls) => setModalState({ isOpen: true, mode: 'delete', currentClass: cls });

  const filteredClasses = useMemo(
    () => classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [classes, searchTerm]
  );

  const handleAddOrEdit = (formData) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      if (modalState.mode === 'add') {
        const newClass = { ...formData, id: 'c' + Date.now(), studentCount: 0 };
        setClasses(prev => [...prev, newClass]);
        setMessage(`Class '${newClass.name}' added successfully.`);
      } else {
        setClasses(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } : c));
        setMessage(`Class '${formData.name}' updated successfully.`);
      }
      setLoading(false);
      closeModal();
    }, 800);
  };

  const handleDeleteConfirmed = (classId, className) => {
    setLoading(true);
    setMessage('');
    closeModal();
    setTimeout(() => {
      setClasses(prev => prev.filter(c => c.id !== classId));
      setMessage(`Class '${className}' deleted successfully.`);
      setLoading(false);
    }, 800);
  };

  // Sub-components
  const ClassForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({ 
      name: initialData?.name || '', 
      maxCapacity: initialData?.maxCapacity || '' 
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ ...initialData, ...formData, maxCapacity: parseInt(formData.maxCapacity) });
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Class Name</label>
          <input type="text" className="form-control rounded-3" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold">Max Capacity</label>
          <input type="number" className="form-control rounded-3" name="maxCapacity" value={formData.maxCapacity} onChange={handleChange} min="1" required />
        </div>
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
            {isSaving ? 'Saving...' : (initialData ? 'Update Class' : 'Add Class')}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirmation = ({ cls, onConfirm, onCancel, isDeleting }) => (
    <>
      <div className="alert alert-warning d-flex align-items-center rounded-3 mb-4">
        <AlertTriangle size={24} className="me-3 text-warning flex-shrink-0" />
        <div>Are you sure you want to delete <strong>{cls.name}</strong>? This action cannot be undone.</div>
      </div>
      <div className="d-flex justify-content-end">
        <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isDeleting}>Cancel</button>
        <button type="button" className="btn btn-danger rounded-3" onClick={() => onConfirm(cls.id, cls.name)} disabled={isDeleting}>
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

  // Stats calculations
  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0);
  const fullClasses = classes.filter(c => c.studentCount >= c.maxCapacity).length;

  return (
    <div className="container py-4">
      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm rounded-4 text-center">
            <BookOpen className="fs-2 text-primary mb-2" />
            <h6 className="text-muted">Total Classes</h6>
            <h4 className="fw-bold">{classes.length}</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm rounded-4 text-center">
            <BookOpen className="fs-2 text-success mb-2" />
            <h6 className="text-muted">Total Students</h6>
            <h4 className="fw-bold">{totalStudents}</h4>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm rounded-4 text-center">
            <BookOpen className="fs-2 text-danger mb-2" />
            <h6 className="text-muted">Full Classes</h6>
            <h4 className="fw-bold">{fullClasses}</h4>
          </div>
        </div>
      </div>

      <div className="card shadow-lg rounded-4 p-3 p-sm-4">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 border-bottom pb-3">
          <h4 className="card-title text-primary mb-2 mb-sm-0 d-flex align-items-center fs-5 fs-sm-4 fw-bold">
            <BookOpen size={24} className="me-2" /> Manage Academic Classes
          </h4>
          <button className="btn btn-primary rounded-3 d-flex justify-content-center align-items-center w-100 w-sm-auto order-first order-sm-last" onClick={openAddModal} disabled={loading}>
            <PlusCircle size={20} className="me-2" /> Add New Class
          </button>
        </div>

        {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">{message}</div>}

        {/* Search */}
        <div className="row mb-4">
          <div className="col-12 col-md-4">
            <div className="input-group rounded-3 overflow-hidden">
              <span className="input-group-text bg-light border-end-0"><Search size={18} /></span>
              <input type="text" className="form-control border-start-0 ps-0" placeholder="Search classes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Class Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Class Name</th>
                <th className="d-none d-sm-table-cell">Capacity</th>
                <th>Students</th>
                <th className="text-center text-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length > 0 ? filteredClasses.map(cls => (
                <tr key={cls.id}>
                  <td className="fw-semibold text-nowrap">{cls.name}</td>
                  <td className="d-none d-sm-table-cell">{cls.maxCapacity}</td>
                  <td className="text-nowrap">
                    {cls.studentCount} / {cls.maxCapacity}
                    {cls.studentCount >= cls.maxCapacity && <span className="badge bg-danger ms-2 rounded-pill d-none d-sm-inline">Full</span>}
                  </td>
                  <td className="text-center text-nowrap">
                    <div className="d-flex justify-content-center flex-wrap">
                      <button className="btn btn-sm btn-outline-secondary me-1 my-1 rounded-3" onClick={() => openEditModal(cls)} disabled={loading}><Edit size={16} /></button>
                      <button className="btn btn-sm btn-outline-danger my-1 rounded-3" onClick={() => openDeleteModal(cls)} disabled={loading}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="text-center text-muted py-3">No classes found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content rounded-4 shadow-lg">
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold">
                    {modalState.mode === 'add' && 'Add New Class'}
                    {modalState.mode === 'edit' && 'Edit Class Details'}
                    {modalState.mode === 'delete' && 'Confirm Deletion'}
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
