import React, { useState } from 'react';
import { Edit, Trash2, Users, Search } from 'lucide-react';

// --- Mock Data ---
const MOCK_TEACHERS = [
  { id: 't001', name: 'Mrs. Jane Doe', subject: 'Mathematics', phone: '0803-111-2233', email: 'jane.doe@example.com', assignedClasses: ['JSS 1', 'JSS 2'] },
  { id: 't002', name: 'Mr. Ken Adams', subject: 'Physics', phone: '0805-333-4455', email: 'ken.adams@example.com', assignedClasses: ['SSS 1', 'SSS 3'] },
  { id: 't003', name: 'Ms. Sarah Connor', subject: 'English', phone: '0810-222-9090', email: 'sarah.connor@example.com', assignedClasses: ['JSS 2', 'SSS 1'] },
  { id: 't004', name: 'Dr. John Miller', subject: 'Chemistry', phone: '0902-777-8888', email: 'john.miller@example.com', assignedClasses: ['SSS 3'] },
];

const MOCK_CLASS_OPTIONS = ['JSS 1', 'JSS 2', 'SSS 1', 'SSS 2', 'SSS 3'];

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState(MOCK_TEACHERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, currentTeacher: null });

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (formData) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      setTeachers(prev => prev.map(t => (t.id === formData.id ? { ...t, ...formData } : t)));
      setMessage(`Teacher '${formData.name}' updated successfully.`);
      setLoading(false);
      setModalState({ isOpen: false, currentTeacher: null });
    }, 800);
  };

  const handleDelete = (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to delete teacher: ${teacherName}?`)) {
      setLoading(true);
      setMessage('');
      setTimeout(() => {
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        setMessage(`Teacher '${teacherName}' deleted successfully.`);
        setLoading(false);
      }, 800);
    }
  };

  const TeacherForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      subject: initialData?.subject || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      assignedClasses: initialData?.assignedClasses || [],
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleClassChange = (e) => {
      const value = Array.from(e.target.selectedOptions, opt => opt.value);
      setFormData({ ...formData, assignedClasses: value });
    };
    const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...initialData, ...formData }); };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control rounded-3" required />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Subject</label>
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="form-control rounded-3" required />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control rounded-3" required />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control rounded-3" required />
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold">Assigned Classes</label>
          <select name="assignedClasses" multiple size="4" value={formData.assignedClasses} onChange={handleClassChange} className="form-select rounded-3" required>
            {MOCK_CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>{isSaving ? 'Saving...' : 'Update Teacher'}</button>
        </div>
      </form>
    );
  };

  return (
    <div className="container py-4">
      <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
          <h4 className="card-title text-dark mb-3 mb-md-0 d-flex align-items-center fw-bold">
            <Users className="text-primary me-2" /> Manage Teachers
          </h4>
        </div>

        {/* Message */}
        {message && <div className="alert alert-success rounded-3">{message}</div>}

        {/* Search */}
        <div className="input-group mb-4 w-100 w-md-75 w-lg-50">
          <span className="input-group-text bg-light rounded-start-pill border-0"><Search className="fs-6" /></span>
          <input type="text" className="form-control rounded-end-pill" placeholder="Search teachers by name, subject, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th className="d-none d-md-table-cell">Email</th>
                <th className="d-none d-md-table-cell">Phone</th>
                <th className="d-none d-lg-table-cell">Classes</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? filteredTeachers.map(t => (
                <tr key={t.id}>
                  <td className="fw-semibold">{t.name}</td>
                  <td>{t.subject}</td>
                  <td className="d-none d-md-table-cell">{t.email}</td>
                  <td className="d-none d-md-table-cell">{t.phone}</td>
                  <td className="d-none d-lg-table-cell">{t.assignedClasses.map(cls => <span key={cls} className="badge bg-secondary me-1 text-truncate" style={{ maxWidth: '80px' }}>{cls}</span>)}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-secondary me-2 rounded-3" onClick={() => setModalState({ isOpen: true, currentTeacher: t })} disabled={loading}><Edit className="fs-6" /></button>
                    <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => handleDelete(t.id, t.name)} disabled={loading}><Trash2 className="fs-6" /></button>
                  </td>
                </tr>
              )) : <tr><td colSpan="6" className="text-center text-muted py-3">No teachers found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content rounded-4 shadow-lg border-0">
                <div className="modal-header bg-light border-bottom">
                  <h5 className="modal-title fw-bold">Edit Teacher</h5>
                  <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, currentTeacher: null })}></button>
                </div>
                <div className="modal-body">
                  <TeacherForm
                    initialData={modalState.currentTeacher}
                    onSubmit={handleEdit}
                    onCancel={() => setModalState({ isOpen: false, currentTeacher: null })}
                    isSaving={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManageTeachers;
