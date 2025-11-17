// src/components/Admin/ManageStudents.js - MOBILE RESPONSIVE VERSION

import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, PlusCircle, Search, AlertTriangle, Download, Upload } from 'lucide-react';
import axios from 'axios';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const ConfirmationModal = ({ isOpen, title, body, onConfirm, onCancel, isSaving }) => {
  if (!isOpen) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title d-flex align-items-center fs-6">
              <AlertTriangle size={20} className="me-2" />{title}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body"><p className="small">{body}</p></div>
          <div className="modal-footer flex-column flex-md-row gap-2">
            <button type="button" className="btn btn-outline-secondary rounded-3 w-100 w-md-auto order-2 order-md-1" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-3 w-100 w-md-auto order-1 order-md-2" onClick={onConfirm} disabled={isSaving}>
              {isSaving ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentCard = ({ student, onEdit, onDelete, loading }) => (
  <div className="card mb-3 shadow-sm rounded-4 border-start border-info border-4">
    <div className="card-body">
      <h6 className="fw-bold mb-1">{student.name}</h6>
      <p className="mb-1 text-muted small">Reg No: {student.regNo}</p>
      <p className="mb-2">
        <span className="badge bg-info text-dark">{student.classId?.name || 'No Class'}</span>
      </p>
      <div className="d-flex justify-content-end gap-2">
        <button 
          className="btn btn-sm btn-outline-secondary" 
          onClick={() => onEdit(student)} 
          disabled={loading}
        >
          <Edit size={16} />
        </button>
        <button 
          className="btn btn-sm btn-outline-danger" 
          onClick={() => onDelete(student._id, student.name)} 
          disabled={loading}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentStudent: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, id: null, name: '', action: () => {} });

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setMessage('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/classes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const classA = a.classId?.name || '';
    const classB = b.classId?.name || '';
    
    if (classA < classB) return -1;
    if (classA > classB) return 1;
    
    return a.name.localeCompare(b.name);
  });

  const studentsByClass = sortedStudents.reduce((acc, student) => {
    const className = student.classId?.name || 'Unassigned';
    acc[className] = acc[className] || [];
    acc[className].push(student);
    return acc;
  }, {});

  const sortedClassNames = Object.keys(studentsByClass).sort();

  const handleAddOrEdit = async (formData) => {
    try {
      setLoading(true);
      setMessage('');

      if (modalState.mode === 'add') {
        await axios.post(
          `${REACT_APP_API_URL}/api/admin/students`,
          formData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setMessage(`Student '${formData.name}' added successfully.`);
      } else {
        await axios.put(
          `${REACT_APP_API_URL}/api/admin/students/${formData._id}`,
          formData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setMessage(`Student '${formData.name}' updated successfully.`);
      }

      await fetchStudents();
      setModalState({ isOpen: false, mode: 'add', currentStudent: null });
    } catch (err) {
      console.error('Failed to save student:', err);
      setMessage(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmState({
      isOpen: true,
      id,
      name,
      action: async () => {
        try {
          setLoading(true);
          setMessage('');
          
          await axios.delete(`${REACT_APP_API_URL}/api/admin/students/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          setMessage(`Student '${name}' deleted successfully.`);
          await fetchStudents();
          setConfirmState({ isOpen: false, id: null, name: '', action: () => {} });
        } catch (err) {
          console.error('Failed to delete student:', err);
          setMessage(err.response?.data?.message || 'Failed to delete student.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCancelDelete = () => {
    setConfirmState({ isOpen: false, id: null, name: '', action: () => {} });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Class', 'Name', 'Registration Number'],
      ...sortedStudents.map(s => [
        s.classId?.name || 'Unassigned',
        s.name,
        s.regNo
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StudentForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
      _id: initialData?._id || '',
      name: initialData?.name || '',
      regNo: initialData?.regNo || '',
      classId: initialData?.classId?._id || '',
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Full Name *</label>
          <input
            type="text"
            className="form-control rounded-3"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Registration Number *</label>
          <input
            type="text"
            className="form-control rounded-3"
            name="regNo"
            value={formData.regNo}
            onChange={handleChange}
            required
          />
          <small className="text-muted">Must be unique</small>
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold small">Class *</label>
          <select
            className="form-select rounded-3"
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Class --</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
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
            {isSaving ? 'Saving...' : (initialData ? 'Update Student' : 'Add Student')}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      <div className="card shadow-lg rounded-4 p-3 p-md-4">
        {/* Header & Add Button */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 border-bottom pb-3 gap-3">
          <div>
            <h4 className="d-flex align-items-center text-primary mb-2 fs-5 fs-md-4">
              <Users size={24} className="me-2" /> Manage Students
            </h4>
            <p className="text-muted mb-0 small">Total: {students.length} students</p>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
            <button
              className="btn btn-outline-success rounded-3 d-flex align-items-center justify-content-center"
              onClick={exportToCSV}
              disabled={students.length === 0}
            >
              <Download size={18} className="me-2" /> <span className="small">Export CSV</span>
            </button>
            <button
              className="btn btn-primary rounded-3 d-flex align-items-center justify-content-center"
              onClick={() => setModalState({ isOpen: true, mode: 'add', currentStudent: null })}
            >
              <PlusCircle size={20} className="me-2" /> <span className="small">Add Student</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} rounded-3`}>
            <small>{message}</small>
          </div>
        )}

        {/* Search */}
        <div className="row mb-4">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light rounded-start-3">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control rounded-end-3"
                placeholder="Search by name, regNo or class"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading && students.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="alert alert-info rounded-3">
            <p className="mb-0 small">No students registered yet. Click "Add Student" to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table grouped by class */}
            <div className="d-none d-md-block">
              {sortedClassNames.map(className => (
                <div key={className} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold text-primary mb-0 fs-6">{className}</h5>
                    <span className="badge bg-primary">{studentsByClass[className].length} students</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="small">#</th>
                          <th className="small">Name</th>
                          <th className="small">Registration Number</th>
                          <th className="text-center small">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsByClass[className].map((student, index) => (
                          <tr key={student._id}>
                            <td className="small">{index + 1}</td>
                            <td className="fw-semibold small">{student.name}</td>
                            <td className="small">{student.regNo}</td>
                            <td className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <button
                                  className="btn btn-sm btn-outline-primary rounded-3"
                                  onClick={() => setModalState({ isOpen: true, mode: 'edit', currentStudent: student })}
                                  disabled={loading}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger rounded-3"
                                  onClick={() => handleDelete(student._id, student.name)}
                                  disabled={loading}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards grouped by class */}
            <div className="d-md-none">
              {sortedClassNames.map(className => (
                <div key={className} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">{className}</h6>
                    <span className="badge bg-primary">{studentsByClass[className].length}</span>
                  </div>
                  {studentsByClass[className].map(student => (
                    <StudentCard
                      key={student._id}
                      student={student}
                      onEdit={s => setModalState({ isOpen: true, mode: 'edit', currentStudent: s })}
                      onDelete={handleDelete}
                      loading={loading}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title fs-6">
                    {modalState.mode === 'add' ? 'Add New Student' : 'Edit Student'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModalState({ isOpen: false, mode: 'add', currentStudent: null })}
                    disabled={loading}
                  ></button>
                </div>
                <div className="modal-body">
                  <StudentForm
                    initialData={modalState.currentStudent}
                    onSubmit={handleAddOrEdit}
                    onCancel={() => setModalState({ isOpen: false, mode: 'add', currentStudent: null })}
                    isSaving={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmState.isOpen}
          title="Confirm Deletion"
          body={`Are you sure you want to delete student: ${confirmState.name}?`}
          onConfirm={confirmState.action}
          onCancel={handleCancelDelete}
          isSaving={loading}
        />
      </div>
    </div>
  );
};

export default ManageStudents;