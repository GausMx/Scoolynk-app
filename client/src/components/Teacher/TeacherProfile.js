// src/components/Teacher/TeacherProfile.js - WITH LOADING COMPONENT

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Users, Camera, Edit, Save, X, Plus, BookOpen, GraduationCap } from 'lucide-react';
import OCRStudentInput from './OCRStudentInput';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const TeacherProfile = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [teacher, setTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    classes: [],
    courses: [],
    classTeacherFor: []
  });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedTeacher, setEditedTeacher] = useState({});
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [addMethod, setAddMethod] = useState(null);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      setLoadingPercent(10);

      await fetchTeacherData();
      setLoadingPercent(60);

      await fetchAvailableOptions();
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setTimeout(() => setInitialLoading(false), 300);
    }
  };

  const fetchTeacherData = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeacher(res.data.teacher);
      setEditedTeacher(res.data.teacher);
      if (res.data.teacher.classTeacherFor?.length > 0) {
        setSelectedClass(res.data.teacher.classTeacherFor[0]._id);
      }
    } catch (err) {
      showMessage('error', 'Failed to load teacher data');
    }
  };

  const fetchAvailableOptions = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/school-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableClasses(res.data.classes || []);
      
      // Fetch available courses from school
      const schoolData = JSON.parse(localStorage.getItem('user'));
      if (schoolData?.schoolId) {
        const coursesRes = await axios.get(
          `${REACT_APP_API_URL}/api/admin/courses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableCourses(coursesRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/class/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      showMessage('error', 'Failed to load students');
    }
  };

  const handleUpdateTeacherInfo = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/teacher/profile`,
        {
          name: editedTeacher.name,
          phone: editedTeacher.phone,
          classes: editedTeacher.classes?.map(c => c._id || c),
          courses: editedTeacher.courses,
          classTeacherFor: editedTeacher.classTeacherFor?.map(c => c._id || c)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Profile updated successfully');
      setIsEditingInfo(false);
      fetchTeacherData();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async (studentId, updates) => {
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/teacher/students/${studentId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Student updated successfully');
      setEditingStudent(null);
      fetchClassStudents(selectedClass);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelect = (e, fieldName) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setEditedTeacher({ ...editedTeacher, [fieldName]: selectedOptions });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const renderInfoTab = () => (
    <div className="card border-0 shadow-sm rounded-4 p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <h5 className="text-primary mb-0">
          <User size={20} className="me-2" />
          Teacher Information
        </h5>
        {!isEditingInfo ? (
          <button 
            className="btn btn-outline-primary btn-sm rounded-3 w-100 w-md-auto"
            onClick={() => setIsEditingInfo(true)}
          >
            <Edit size={16} className="me-1" />
            Edit Profile
          </button>
        ) : (
          <div className="btn-group btn-group-sm w-100 w-md-auto">
            <button 
              className="btn btn-success rounded-start-3"
              onClick={handleUpdateTeacherInfo}
              disabled={loading}
            >
              <Save size={16} className="me-1" />
              Save Changes
            </button>
            <button 
              className="btn btn-secondary rounded-end-3"
              onClick={() => {
                setIsEditingInfo(false);
                setEditedTeacher(teacher);
              }}
            >
              <X size={16} className="me-1" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="row g-3">
        {/* Name */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small">
            <User size={16} className="me-1" />
            Name
          </label>
          {isEditingInfo ? (
            <input 
              type="text" 
              className="form-control rounded-3"
              value={editedTeacher.name || ''}
              onChange={(e) => setEditedTeacher({...editedTeacher, name: e.target.value})}
            />
          ) : (
            <input 
              type="text" 
              className="form-control rounded-3 bg-light" 
              value={teacher.name} 
              disabled 
            />
          )}
        </div>

        {/* Email */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small">
            <i className="bi bi-envelope me-1"></i>
            Email
          </label>
          <input 
            type="email" 
            className="form-control rounded-3 bg-light" 
            value={teacher.email} 
            disabled 
          />
          <small className="text-muted">Email cannot be changed</small>
        </div>

        {/* Phone */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small">
            <i className="bi bi-telephone me-1"></i>
            Phone
          </label>
          {isEditingInfo ? (
            <input 
              type="tel" 
              className="form-control rounded-3"
              value={editedTeacher.phone || ''}
              onChange={(e) => setEditedTeacher({...editedTeacher, phone: e.target.value})}
            />
          ) : (
            <input 
              type="text" 
              className="form-control rounded-3 bg-light" 
              value={teacher.phone} 
              disabled 
            />
          )}
        </div>

        {/* Classes Teaching */}
        <div className="col-12">
          <label className="form-label fw-semibold small">
            <GraduationCap size={16} className="me-1" />
            Classes Teaching
          </label>
          {isEditingInfo ? (
            <>
              <select
                multiple
                className="form-select rounded-3"
                size="5"
                value={editedTeacher.classes?.map(c => c._id || c) || []}
                onChange={(e) => handleMultiSelect(e, 'classes')}
              >
                {availableClasses.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Hold Ctrl/Cmd for multiple selection. Selected: {editedTeacher.classes?.length || 0} class(es)
              </small>
            </>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {teacher.classes?.map(cls => (
                <span key={cls._id} className="badge bg-primary px-3 py-2">
                  {cls.name}
                </span>
              ))}
              {(!teacher.classes || teacher.classes?.length === 0) && (
                <span className="text-muted small">No classes assigned</span>
              )}
            </div>
          )}
        </div>

        {/* Courses/Subjects Teaching */}
        <div className="col-12">
          <label className="form-label fw-semibold small">
            <BookOpen size={16} className="me-1" />
            Courses/Subjects Teaching
          </label>
          {isEditingInfo ? (
            <>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Enter courses separated by commas (e.g., Mathematics, English, Science)"
                value={Array.isArray(editedTeacher.courses) ? editedTeacher.courses.join(', ') : editedTeacher.courses || ''}
                onChange={(e) => {
                  const coursesArray = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                  setEditedTeacher({...editedTeacher, courses: coursesArray});
                }}
              />
              <small className="text-muted">
                Enter course names separated by commas
              </small>
            </>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {teacher.courses?.map((course, idx) => (
                <span key={idx} className="badge bg-success px-3 py-2">
                  {course}
                </span>
              ))}
              {(!teacher.courses || teacher.courses?.length === 0) && (
                <span className="text-muted small">No courses assigned</span>
              )}
            </div>
          )}
        </div>

        {/* Class Teacher For */}
        <div className="col-12">
          <label className="form-label fw-semibold small">
            <i className="bi bi-person-check me-1"></i>
            Class Teacher For
          </label>
          {isEditingInfo ? (
            <>
              <select
                multiple
                className="form-select rounded-3"
                size="5"
                value={editedTeacher.classTeacherFor?.map(c => c._id || c) || []}
                onChange={(e) => handleMultiSelect(e, 'classTeacherFor')}
              >
                {availableClasses.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Hold Ctrl/Cmd for multiple selection. Selected: {editedTeacher.classTeacherFor?.length || 0} class(es)
              </small>
            </>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {teacher.classTeacherFor?.map(cls => (
                <span key={cls._id} className="badge bg-info px-3 py-2">
                  {cls.name}
                </span>
              ))}
              {(!teacher.classTeacherFor || teacher.classTeacherFor?.length === 0) && (
                <span className="text-muted small">Not a class teacher for any class</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStudentsTab = () => (
    <div>
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="row align-items-center g-2">
          <div className="col-12 col-md-8">
            <select className="form-select rounded-3" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Select Class</option>
              {teacher.classTeacherFor?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <button className="btn btn-primary rounded-3 w-100" onClick={() => setShowAddStudents(true)} disabled={!selectedClass}>
              <Plus size={18} className="me-2" />Add Students
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
                  <th className="small">Student Name</th>
                  <th className="small">Reg No</th>
                  <th className="small d-none d-md-table-cell">Parent Name</th>
                  <th className="small d-none d-lg-table-cell">Parent Phone</th>
                  <th className="small d-none d-md-table-cell">Fee</th>
                  <th className="small d-none d-md-table-cell">Paid</th>
                  <th className="small">Status</th>
                  <th className="text-center small">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id}>
                    <td>
                      {editingStudent?._id === student._id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editingStudent.name}
                          onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                        />
                      ) : (
                        <strong className="small">{student.name}</strong>
                      )}
                    </td>
                    <td><small className="text-muted">{student.regNo}</small></td>
                    <td className="d-none d-md-table-cell">
                      {editingStudent?._id === student._id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editingStudent.parentName || ''}
                          onChange={(e) => setEditingStudent({...editingStudent, parentName: e.target.value})}
                          placeholder="Parent name"
                        />
                      ) : (
                        <small>{student.parentName || 'N/A'}</small>
                      )}
                    </td>
                    <td className="d-none d-lg-table-cell">
                      {editingStudent?._id === student._id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editingStudent.parentPhone || ''}
                          onChange={(e) => setEditingStudent({...editingStudent, parentPhone: e.target.value})}
                          placeholder="Phone number"
                        />
                      ) : (
                        <small>{student.parentPhone || 'N/A'}</small>
                      )}
                    </td>
                    <td className="d-none d-md-table-cell"><small>₦{student.classFee?.toLocaleString()}</small></td>
                    <td className="d-none d-md-table-cell">
                      {editingStudent?._id === student._id ? (
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editingStudent.amountPaid || 0}
                          onChange={(e) => setEditingStudent({...editingStudent, amountPaid: parseFloat(e.target.value) || 0})}
                        />
                      ) : (
                        <span className={student.amountPaid > 0 ? 'text-success' : 'text-muted'}>
                          <small>₦{student.amountPaid?.toLocaleString() || 0}</small>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        student.paymentStatus === 'paid' ? 'bg-success' :
                        student.paymentStatus === 'partial' ? 'bg-warning' : 'bg-danger'
                      }`}>
                        <small>{student.paymentStatus}</small>
                      </span>
                    </td>
                    <td className="text-center">
                      {editingStudent?._id === student._id ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success rounded-start-3"
                            onClick={() => handleUpdateStudent(student._id, {
                              name: editingStudent.name,
                              parentName: editingStudent.parentName,
                              parentPhone: editingStudent.parentPhone,
                              amountPaid: editingStudent.amountPaid
                            })}
                          >
                            <Save size={14} />
                          </button>
                          <button className="btn btn-secondary rounded-end-3" onClick={() => setEditingStudent(null)}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setEditingStudent({ ...student })}>
                          <Edit size={14} />
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
        <div className="alert alert-info rounded-3">
          <small>{selectedClass ? 'No students in this class yet.' : 'Select a class to view students.'}</small>
        </div>
      )}
    </div>
  );

  const renderAddStudentsModal = () => (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title text-primary">Add Students</h5>
            <button type="button" className="btn-close" onClick={() => {
              setShowAddStudents(false);
              setAddMethod(null);
            }}></button>
          </div>
          <div className="modal-body">
            {!addMethod ? (
              <div className="text-center py-4">
                <h6 className="mb-4">Choose Method</h6>
                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                  <button className="btn btn-primary btn-lg rounded-3" onClick={() => setAddMethod('ocr')}>
                    <Camera size={20} className="me-2" />Scan (OCR)
                  </button>
                  <button className="btn btn-secondary btn-lg rounded-3" onClick={() => setAddMethod('manual')}>
                    <Edit size={20} className="me-2" />Manual Entry
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
                  fetchClassStudents(selectedClass);
                  showMessage('success', 'Students added successfully!');
                }}
                onCancel={() => {
                  setShowAddStudents(false);
                  setAddMethod(null);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (initialLoading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      <div className="mb-4">
        <h2 className="fw-bold text-primary d-flex align-items-center">
          <User size={32} className="me-2" />My Profile
        </h2>
        <p className="text-muted small">Manage your profile and students</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show rounded-3`}>
          <small>{message.text}</small>
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <ul className="nav nav-pills mb-4 gap-2 flex-column flex-md-row">
        <li className="nav-item">
          <button className={`nav-link rounded-3 w-100 w-md-auto ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            <User size={18} className="me-2" />Information
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link rounded-3 w-100 w-md-auto ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            <Users size={18} className="me-2" />Manage Students
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'students' && renderStudentsTab()}
      </div>

      {showAddStudents && renderAddStudentsModal()}
    </div>
  );
};

export default TeacherProfile;