import React, { useState } from 'react';
import { Users, Edit, Trash2, PlusCircle, Search, AlertTriangle } from 'lucide-react';

// Mock Data
const MOCK_STUDENTS = [
  { id: 's001', name: 'Ngozi Okoro', regNo: 'SCH001', class: 'JSS 1', parentName: 'Mr. David Okoro' },
  { id: 's002', name: 'Chinedu Eze', regNo: 'SCH002', class: 'SSS 3', parentName: 'Mrs. Chioma Eze' },
  { id: 's003', name: 'Fatima Bello', regNo: 'SCH003', class: 'JSS 2', parentName: 'Alhaji Abdul Bello' },
  { id: 's004', name: 'Kunle Adebayo', regNo: 'SCH004', class: 'SSS 1', parentName: 'Ms. Tola Adebayo' },
];

// Options
const MOCK_CLASS_OPTIONS = ['JSS 1', 'JSS 2', 'SSS 1', 'SSS 2', 'SSS 3'];
const MOCK_PARENTS = [
  { id: 'p101', name: 'Mr. David Okoro' },
  { id: 'p102', name: 'Mrs. Chioma Eze' },
  { id: 'p103', name: 'Alhaji Abdul Bello' },
  { id: 'p104', name: 'Ms. Tola Adebayo' },
  { id: 'p105', name: 'New Parent (Not yet linked)' },
];

// Confirmation Modal
const ConfirmationModal = ({ isOpen, title, body, onConfirm, onCancel, isSaving }) => {
  if (!isOpen) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title d-flex align-items-center"><AlertTriangle size={20} className="me-2" />{title}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body"><p>{body}</p></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="button" className="btn btn-danger rounded-3" onClick={onConfirm} disabled={isSaving}>{isSaving ? 'Deleting...' : 'Confirm Delete'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Card Component
const StudentCard = ({ student, onEdit, onDelete, loading }) => (
  <div className="card mb-3 shadow-sm rounded-4 border-start border-info border-4">
    <div className="card-body">
      <h6 className="fw-bold mb-1">{student.name}</h6>
      <p className="mb-1 text-muted">Reg No: {student.regNo}</p>
      <p className="mb-1"><span className="badge bg-info text-dark">{student.class}</span></p>
      <p className="mb-2">Parent: {student.parentName}</p>
      <div className="d-flex justify-content-end">
        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => onEdit(student)} disabled={loading}><Edit size={16} /></button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(student.id, student.name)} disabled={loading}><Trash2 size={16} /></button>
      </div>
    </div>
  </div>
);

const ManageStudents = () => {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentStudent: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, id: null, name: '', action: () => {} });

  // Filter students based on search
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group students by class
  const studentsByClass = filteredStudents.reduce((acc, student) => {
    acc[student.class] = acc[student.class] || [];
    acc[student.class].push(student);
    return acc;
  }, {});

  // CRUD handlers
  const handleAddOrEdit = (formData) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      if (modalState.mode === 'add') {
        const newStudent = { ...formData, id: 's' + Date.now() };
        setStudents(prev => [...prev, newStudent]);
        setMessage(`Student '${newStudent.name}' added successfully.`);
      } else {
        setStudents(prev => prev.map(s => s.id === formData.id ? { ...s, ...formData } : s));
        setMessage(`Student '${formData.name}' updated successfully.`);
      }
      setLoading(false);
      setModalState({ isOpen: false, mode: 'add', currentStudent: null });
    }, 800);
  };

  const handleDelete = (id, name) => {
    setConfirmState({
      isOpen: true,
      id,
      name,
      action: () => {
        setLoading(true);
        setMessage('');
        setTimeout(() => {
          setStudents(prev => prev.filter(s => s.id !== id));
          setMessage(`Student '${name}' deleted successfully.`);
          setLoading(false);
          setConfirmState({ isOpen: false, id: null, name: '', action: () => {} });
        }, 800);
      }
    });
  };

  const handleCancelDelete = () => setConfirmState({ isOpen: false, id: null, name: '', action: () => {} });

  // Student Form Component
  const StudentForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      regNo: initialData?.regNo || '',
      class: initialData?.class || MOCK_CLASS_OPTIONS[0],
      parentName: initialData?.parentName || MOCK_PARENTS[0].name,
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
          <label className="form-label fw-semibold">Registration Number</label>
          <input type="text" className="form-control rounded-3" name="regNo" value={formData.regNo} onChange={handleChange} required />
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Class</label>
            <select className="form-select rounded-3" name="class" value={formData.class} onChange={handleChange}>
              {MOCK_CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label fw-semibold">Parent</label>
            <select className="form-select rounded-3" name="parentName" value={formData.parentName} onChange={handleChange}>
              {MOCK_PARENTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>{isSaving ? 'Saving...' : (initialData ? 'Update Student' : 'Add Student')}</button>
        </div>
      </form>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-lg rounded-4 p-4">

        {/* Header & Add Button */}
        <div className="d-block d-md-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h4 className="d-flex align-items-center text-primary mb-3 mb-md-0"><Users size={24} className="me-2" /> Manage Students</h4>
          <button className="btn btn-primary rounded-3 d-flex align-items-center w-100 w-md-auto" onClick={() => setModalState({ isOpen: true, mode: 'add', currentStudent: null })}><PlusCircle size={20} className="me-2" /> Add New Student</button>
        </div>

        {/* Message */}
        {message && <div className="alert alert-success rounded-3">{message}</div>}

        {/* Search */}
        <div className="row mb-4">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light rounded-start-3"><Search size={18} /></span>
              <input type="text" className="form-control rounded-end-3" placeholder="Search by name, regNo or class" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Desktop Table grouped by class */}
        <div className="d-none d-md-block table-responsive">
          {Object.keys(studentsByClass).map(cls => (
            <div key={cls} className="mb-4">
              <h6 className="fw-bold">{cls}</h6>
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reg No</th>
                    <th>Parent</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsByClass[cls].map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.regNo}</td>
                      <td>{student.parentName}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setModalState({ isOpen: true, mode: 'edit', currentStudent: student })}><Edit size={16} /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(student.id, student.name)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Mobile Cards grouped by class */}
        <div className="d-md-none">
          {Object.keys(studentsByClass).map(cls => (
            <div key={cls} className="mb-3">
              <h6 className="fw-bold mb-2">{cls}</h6>
              {studentsByClass[cls].map(student => (
                <StudentCard key={student.id} student={student} onEdit={s => setModalState({ isOpen: true, mode: 'edit', currentStudent: s })} onDelete={handleDelete} loading={loading} />
              ))}
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title">{modalState.mode === 'add' ? 'Add New Student' : 'Edit Student'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentStudent: null })} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <StudentForm initialData={modalState.currentStudent} onSubmit={handleAddOrEdit} onCancel={() => setModalState({ isOpen: false, mode: 'add', currentStudent: null })} isSaving={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Conf irmation Modal */}
        <ConfirmationModal isOpen={confirmState.isOpen} title="Confirm Deletion" body={`Are you sure you want to delete student: ${confirmState.name}?`} onConfirm={confirmState.action} onCancel={handleCancelDelete} isSaving={loading} />
      </div>
    </div>
  );
};

export default ManageStudents;
