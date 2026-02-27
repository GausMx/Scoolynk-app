// src/components/Teacher/TeacherProfile.jsx
// Teacher profile — reads teacher.courses directly from teacher profile API.
// No longer fetches from /api/admin/courses (which returns school-wide list, not teacher's).

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Users, Edit, Save, X, Plus, BookOpen, GraduationCap, Camera } from 'lucide-react';
import OCRStudentInput from './OCRStudentInput';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const TeacherProfile = () => {
  const [activeTab,       setActiveTab]       = useState('info');
  const [loading,         setLoading]         = useState(false);
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [loadingPercent,  setLoadingPercent]  = useState(0);
  const [message,         setMessage]         = useState({ type: '', text: '' });

  const [teacher,         setTeacher]         = useState({
    name: '', email: '', phone: '', classes: [], courses: [], classTeacherFor: [],
  });
  const [isEditing,       setIsEditing]       = useState(false);
  const [editedTeacher,   setEditedTeacher]   = useState({});

  const [availableClasses, setAvailableClasses] = useState([]);

  const [students,         setStudents]        = useState([]);
  const [selectedClass,    setSelectedClass]   = useState('');
  const [editingStudent,   setEditingStudent]  = useState(null);
  const [showAddStudents,  setShowAddStudents] = useState(false);
  const [addMethod,        setAddMethod]       = useState(null);

  const token = localStorage.getItem('accessToken');
  const authHdr = () => ({ Authorization: `Bearer ${token}` });

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selectedClass) fetchStudents(selectedClass); }, [selectedClass]);

  const init = async () => {
    setInitialLoading(true);
    setLoadingPercent(10);
    try {
      await loadTeacher();
      setLoadingPercent(60);
      await loadClasses();
      setLoadingPercent(100);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setInitialLoading(false), 200);
    }
  };

  const loadTeacher = async () => {
    // Use the dashboard endpoint — it returns teacher.courses as the correct string array
    const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, { headers: authHdr() });
    const t = res.data.teacher;
    setTeacher(t);
    setEditedTeacher(t);
    if (t.classTeacherFor?.length > 0) setSelectedClass(t.classTeacherFor[0]._id);
  };

  const loadClasses = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/school-classes`, { headers: authHdr() });
      setAvailableClasses(res.data.classes || []);
    } catch (e) {
      console.error('Failed to fetch classes:', e);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/class/${classId}/students`, { headers: authHdr() });
      setStudents(res.data.students || []);
    } catch (e) {
      showMsg('error', 'Failed to load students.');
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/teacher/profile`,
        {
          name:           editedTeacher.name,
          phone:          editedTeacher.phone,
          classes:        editedTeacher.classes?.map(c => c._id || c),
          courses:        Array.isArray(editedTeacher.courses) ? editedTeacher.courses : [],
          classTeacherFor: editedTeacher.classTeacherFor?.map(c => c._id || c),
        },
        { headers: authHdr() }
      );
      showMsg('success', 'Profile updated successfully.');
      setIsEditing(false);
      await loadTeacher();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const saveStudent = async (studentId) => {
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/teacher/students/${studentId}`,
        {
          name:        editingStudent.name,
          parentName:  editingStudent.parentName,
          parentPhone: editingStudent.parentPhone,
        },
        { headers: authHdr() }
      );
      showMsg('success', 'Student updated.');
      setEditingStudent(null);
      fetchStudents(selectedClass);
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Failed to update student.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (initialLoading) return <Loading percentage={loadingPercent} />;

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: 800 }}>

      <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
        <User size={24} className="text-primary" /> My Profile
      </h4>
      <p className="text-muted small mb-4">Manage your info and students</p>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible py-2`}>
          <small>{message.text}</small>
          <button className="btn-close" onClick={() => setMessage({ type: '', text: '' })} />
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button className={`nav-link rounded-3 ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            <User size={15} className="me-1" /> Information
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link rounded-3 ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            <Users size={15} className="me-1" /> Manage Students
          </button>
        </li>
      </ul>

      {activeTab === 'info' && (
        <div className="card border-0 shadow-sm rounded-4 p-4">

          {/* Header row */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h6 className="fw-bold mb-0">Teacher Information</h6>
            {!isEditing ? (
              <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => setIsEditing(true)}>
                <Edit size={14} className="me-1" /> Edit
              </button>
            ) : (
              <div className="d-flex gap-2">
                <button className="btn btn-success btn-sm rounded-3" onClick={saveProfile} disabled={loading}>
                  <Save size={14} className="me-1" /> Save
                </button>
                <button className="btn btn-secondary btn-sm rounded-3" onClick={() => { setIsEditing(false); setEditedTeacher(teacher); }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="row g-3">
            {/* Name */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Name</label>
              {isEditing
                ? <input className="form-control" value={editedTeacher.name || ''} onChange={e => setEditedTeacher({ ...editedTeacher, name: e.target.value })} />
                : <input className="form-control bg-light" value={teacher.name || ''} disabled />
              }
            </div>

            {/* Email — always read-only */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Email</label>
              <input className="form-control bg-light" value={teacher.email || ''} disabled />
              <small className="text-muted">Cannot be changed</small>
            </div>

            {/* Phone */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Phone</label>
              {isEditing
                ? <input className="form-control" value={editedTeacher.phone || ''} onChange={e => setEditedTeacher({ ...editedTeacher, phone: e.target.value })} />
                : <input className="form-control bg-light" value={teacher.phone || ''} disabled />
              }
            </div>

            {/* Subjects — teacher.courses string array */}
            <div className="col-12">
              <label className="form-label small fw-semibold">
                <BookOpen size={14} className="me-1" /> Subjects Teaching
              </label>
              {isEditing ? (
                <>
                  <input
                    className="form-control"
                    placeholder="e.g. Mathematics, English, Basic Science"
                    value={Array.isArray(editedTeacher.courses) ? editedTeacher.courses.join(', ') : ''}
                    onChange={e => setEditedTeacher({
                      ...editedTeacher,
                      courses: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })}
                  />
                  <small className="text-muted">Separate subjects with commas</small>
                </>
              ) : (
                <div className="d-flex flex-wrap gap-2 pt-1">
                  {teacher.courses?.length > 0
                    ? teacher.courses.map((c, i) => <span key={i} className="badge bg-primary-subtle text-primary px-3 py-2">{c}</span>)
                    : <span className="text-muted small">No subjects assigned</span>
                  }
                </div>
              )}
            </div>

            {/* Classes Teaching */}
            <div className="col-12">
              <label className="form-label small fw-semibold">
                <GraduationCap size={14} className="me-1" /> Classes Teaching
              </label>
              {isEditing ? (
                <>
                  <select multiple className="form-select" size={5}
                    value={editedTeacher.classes?.map(c => c._id || c) || []}
                    onChange={e => setEditedTeacher({ ...editedTeacher, classes: Array.from(e.target.selectedOptions, o => o.value) })}>
                    {availableClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple</small>
                </>
              ) : (
                <div className="d-flex flex-wrap gap-2 pt-1">
                  {teacher.classes?.length > 0
                    ? teacher.classes.map(c => <span key={c._id} className="badge bg-success-subtle text-success px-3 py-2">{c.name}</span>)
                    : <span className="text-muted small">No classes assigned</span>
                  }
                </div>
              )}
            </div>

            {/* Class Teacher For */}
            <div className="col-12">
              <label className="form-label small fw-semibold">Class Teacher For</label>
              {isEditing ? (
                <>
                  <select multiple className="form-select" size={5}
                    value={editedTeacher.classTeacherFor?.map(c => c._id || c) || []}
                    onChange={e => setEditedTeacher({ ...editedTeacher, classTeacherFor: Array.from(e.target.selectedOptions, o => o.value) })}>
                    {availableClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple</small>
                </>
              ) : (
                <div className="d-flex flex-wrap gap-2 pt-1">
                  {teacher.classTeacherFor?.length > 0
                    ? teacher.classTeacherFor.map(c => <span key={c._id} className="badge bg-info-subtle text-info px-3 py-2">{c.name}</span>)
                    : <span className="text-muted small">Not a class teacher for any class</span>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="row g-2 align-items-center">
              <div className="col">
                <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  <option value="">Select class…</option>
                  {teacher.classTeacherFor?.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-auto">
                <button className="btn btn-primary" onClick={() => setShowAddStudents(true)} disabled={!selectedClass}>
                  <Plus size={16} className="me-1" /> Add Students
                </button>
              </div>
            </div>
          </div>

          {students.length > 0 ? (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="small">Name</th>
                      <th className="small">Reg No</th>
                      <th className="small d-none d-md-table-cell">Parent</th>
                      <th className="small d-none d-lg-table-cell">Phone</th>
                      <th className="text-center small">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td>
                          {editingStudent?._id === s._id
                            ? <input className="form-control form-control-sm" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                            : <strong className="small">{s.name}</strong>
                          }
                        </td>
                        <td><small className="text-muted">{s.regNo}</small></td>
                        <td className="d-none d-md-table-cell">
                          {editingStudent?._id === s._id
                            ? <input className="form-control form-control-sm" value={editingStudent.parentName || ''} placeholder="Parent name" onChange={e => setEditingStudent({ ...editingStudent, parentName: e.target.value })} />
                            : <small>{s.parentName || '—'}</small>
                          }
                        </td>
                        <td className="d-none d-lg-table-cell">
                          {editingStudent?._id === s._id
                            ? <input className="form-control form-control-sm" value={editingStudent.parentPhone || ''} placeholder="Phone" onChange={e => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })} />
                            : <small>{s.parentPhone || '—'}</small>
                          }
                        </td>
                        <td className="text-center">
                          {editingStudent?._id === s._id ? (
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-success rounded-start-3" onClick={() => saveStudent(s._id)}><Save size={13} /></button>
                              <button className="btn btn-secondary rounded-end-3" onClick={() => setEditingStudent(null)}><X size={13} /></button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setEditingStudent({ ...s })}>
                              <Edit size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="alert alert-info small">
              {selectedClass ? 'No students in this class yet.' : 'Select a class to view students.'}
            </div>
          )}
        </div>
      )}

      {/* Add students modal */}
      {showAddStudents && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title text-primary">Add Students</h5>
                <button className="btn-close" onClick={() => { setShowAddStudents(false); setAddMethod(null); }} />
              </div>
              <div className="modal-body">
                {!addMethod ? (
                  <div className="text-center py-4">
                    <p className="mb-4 text-muted">Choose how to add students</p>
                    <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                      <button className="btn btn-primary btn-lg rounded-3" onClick={() => setAddMethod('ocr')}>
                        <Camera size={18} className="me-2" /> Scan (OCR)
                      </button>
                      <button className="btn btn-outline-secondary btn-lg rounded-3" onClick={() => setAddMethod('manual')}>
                        <Edit size={18} className="me-2" /> Manual Entry
                      </button>
                    </div>
                  </div>
                ) : (
                  <OCRStudentInput
                    classId={selectedClass}
                    method={addMethod}
                    onComplete={() => {
                      setShowAddStudents(false);
                      setAddMethod(null);
                      fetchStudents(selectedClass);
                      showMsg('success', 'Students added successfully!');
                    }}
                    onCancel={() => { setShowAddStudents(false); setAddMethod(null); }}
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

export default TeacherProfile;