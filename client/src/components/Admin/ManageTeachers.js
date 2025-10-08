import React, { useState } from 'react';

// --- Icon Components (Bootstrap Icons) ---
const IconEdit = ({ className = "" }) => <i className={`bi bi-pencil-square ${className}`}></i>;
const IconTrash = ({ className = "" }) => <i className={`bi bi-trash-fill ${className}`}></i>;
const IconPlus = ({ className = "" }) => <i className={`bi bi-plus-circle-fill ${className}`}></i>;
const IconSearch = ({ className = "" }) => <i className={`bi bi-search ${className}`}></i>;
const IconTeachers = ({ className = "" }) => <i className={`bi bi-person-video2 fs-4 ${className}`}></i>;

// --- Mock Data ---
const MOCK_TEACHERS = [
  { id: 't001', name: 'Mrs. Jane Doe', subject: 'Mathematics', phone: '0901-111-2222', coursesTaught: 3 },
  { id: 't002', name: 'Mr. Ken Adams', subject: 'Physics', phone: '0802-333-4444', coursesTaught: 2 },
  { id: 't003', name: 'Ms. Sarah Connor', subject: 'English Language', phone: '0703-555-6666', coursesTaught: 1 },
  { id: 't004', name: 'Dr. John Miller', subject: 'Chemistry', phone: '0814-777-8888', coursesTaught: 2 },
];
const MOCK_SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'English Language', 'Chemistry', 'Biology', 'History'];

// --- 1. Confirmation Modal ---
const ConfirmationModal = ({ isOpen, title, body, onConfirm, onCancel, isProcessing }) => {
  if (!isOpen) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header bg-danger text-white border-0">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p>{body}</p>
          </div>
          <div className="modal-footer justify-content-between border-top-0">
            <button type="button" className="btn btn-secondary rounded-3" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-3" onClick={onConfirm} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. Teacher Form ---
const TeacherForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || MOCK_SUBJECT_OPTIONS[0],
    phone: initialData?.phone || '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...initialData, ...formData }); };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label fw-semibold">Full Name</label>
        <input type="text" className="form-control rounded-3" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Primary Subject</label>
        <select className="form-select rounded-3" name="subject" value={formData.subject} onChange={handleChange} required>
          {MOCK_SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label className="form-label fw-semibold">Phone Number</label>
        <input type="tel" className="form-control rounded-3" name="phone" value={formData.phone} onChange={handleChange} required />
      </div>
      <div className="d-flex justify-content-end">
        <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>{isSaving ? 'Saving...' : (initialData ? 'Update Teacher' : 'Add Teacher')}</button>
      </div>
    </form>
  );
};

// --- 3. Mobile Card ---
const TeacherCard = ({ teacher, onEdit, onDelete, loading }) => {
  const isDeleteDisabled = loading || teacher.coursesTaught > 0;
  const deleteTooltip = teacher.coursesTaught > 0 ? "Cannot delete: assigned to courses." : "Delete Teacher";

  return (
    <div className="card shadow-sm mb-3 rounded-4 border-start border-primary border-4">
      <div className="card-body d-flex justify-content-between align-items-start">
        <div>
          <h6 className="mb-1 fw-bold text-dark">{teacher.name}</h6>
          <span className="badge bg-primary rounded-pill mb-2">{teacher.subject}</span>
          <p className="small text-muted mb-1">{teacher.phone}</p>
          <div className="small text-info fw-semibold">{teacher.coursesTaught} Course{teacher.coursesTaught !== 1 ? 's' : ''} Taught</div>
        </div>
        <div className="d-flex flex-column align-items-end">
          <button className="btn btn-sm btn-outline-secondary mb-2 rounded-3" onClick={() => onEdit(teacher)} disabled={loading} title="Edit Teacher">
            <IconEdit />
          </button>
          <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => onDelete(teacher.id, teacher.name)} disabled={isDeleteDisabled} title={deleteTooltip}>
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Main Component ---
const ManageTeachers = () => {
  const [teachers, setTeachers] = useState(MOCK_TEACHERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentTeacher: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, teacherId: null, teacherName: '' });

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddOrEdit = (formData) => {
    setLoading(true); setMessage('');
    setTimeout(() => {
      if (modalState.mode === 'add') {
        const newTeacher = { ...formData, id: 't' + Date.now(), coursesTaught: 0 };
        setTeachers(prev => [...prev, newTeacher]);
        setMessage(`Teacher '${newTeacher.name}' added successfully. (API simulation)`);
      } else {
        setTeachers(prev => prev.map(t => t.id === formData.id ? { ...t, ...formData } : t));
        setMessage(`Teacher '${formData.name}' updated successfully. (API simulation)`);
      }
      setLoading(false); setModalState({ isOpen: false, mode: 'add', currentTeacher: null });
    }, 800);
  };

  const handleDelete = (teacherId, teacherName) => setConfirmState({ isOpen: true, teacherId, teacherName });
  const handleConfirmDelete = () => {
    const { teacherId, teacherName } = confirmState;
    setLoading(true); setConfirmState({ isOpen: false, teacherId: null, teacherName: '' }); setMessage('');
    setTimeout(() => { setTeachers(prev => prev.filter(t => t.id !== teacherId)); setMessage(`Teacher '${teacherName}' deleted successfully. (API simulation)`); setLoading(false); }, 800);
  };

  const openEditModal = (teacher) => setModalState({ isOpen: true, mode: 'edit', currentTeacher: teacher });
  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', currentTeacher: null });

  return (
    <div className="container py-4">
      <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
          <h4 className="card-title text-dark mb-3 mb-md-0 d-flex align-items-center fw-bold"><IconTeachers className="text-primary me-2" /> Manage Teachers</h4>
          <button className="btn btn-primary rounded-pill d-flex align-items-center justify-content-center px-4 py-2 w-100 w-md-auto" onClick={openAddModal} disabled={loading}>
            <IconPlus className="me-2 fs-5" /> Add New Teacher
          </button>
        </div>

        {/* Message */}
        {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">{message}</div>}

        {/* Search */}
        <div className="input-group mb-4 mx-auto" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-light rounded-start-pill border-0"><IconSearch className="fs-6" /></span>
          <input type="text" className="form-control rounded-end-pill" placeholder="Search by name or subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* Desktop Table */}
        <div className="table-responsive d-none d-md-block">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th><th>Primary Subject</th><th>Phone</th><th className="text-center">Courses Taught</th><th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? filteredTeachers.map(item => {
                const isDeleteDisabled = loading || item.coursesTaught > 0;
                return (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td><span className="badge bg-primary rounded-pill">{item.subject}</span></td>
                    <td>{item.phone}</td>
                    <td className="text-center">{item.coursesTaught}</td>
                    <td className="text-center text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-2 rounded-3" onClick={() => openEditModal(item)} disabled={loading} title="Edit Teacher"><IconEdit className="fs-6" /></button>
                      <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => handleDelete(item.id, item.name)} disabled={isDeleteDisabled} title={isDeleteDisabled ? "Cannot delete: assigned to courses." : "Delete Teacher"}><IconTrash className="fs-6" /></button>
                    </td>
                  </tr>
                )
              }) : <tr><td colSpan="5" className="text-center text-muted py-3">No teachers found matching your search.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="d-md-none">
          {filteredTeachers.length > 0 ? filteredTeachers.map(item => <TeacherCard key={item.id} teacher={item} onEdit={openEditModal} onDelete={handleDelete} loading={loading} />) : <div className="text-center text-muted py-3">No teachers found matching your search.</div>}
        </div>

        {/* Modals */}
        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 shadow-lg border-0">
                <div className="modal-header bg-light border-bottom">
                  <h5 className="modal-title fw-bold">{modalState.mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentTeacher: null })}></button>
                </div>
                <div className="modal-body">
                  <TeacherForm initialData={modalState.currentTeacher} onSubmit={handleAddOrEdit} onCancel={() => setModalState({ isOpen: false, mode: 'add', currentTeacher: null })} isSaving={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal isOpen={confirmState.isOpen} title="Confirm Deletion" body={`Are you sure you want to delete teacher: ${confirmState.teacherName}? This action is irreversible and will unassign them from all courses.`} onConfirm={handleConfirmDelete} onCancel={() => setConfirmState({ isOpen: false, teacherId: null, teacherName: '' })} isProcessing={loading} />
      </div>
    </div>
  );
};

export default ManageTeachers;
