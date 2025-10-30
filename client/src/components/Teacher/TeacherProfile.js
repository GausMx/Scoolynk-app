// src/components/Teacher/TeacherProfile.js - COMPLETE

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Users, Camera, Edit, Save, X, Plus, DollarSign } from 'lucide-react';
import OCRStudentInput from './OCRStudentInput';

const { REACT_APP_API_URL } = process.env;

const TeacherProfile = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Teacher info
  const [teacher, setTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    classes: [],
    classTeacherFor: []
  });

  // Students
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Add students
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [addMethod, setAddMethod] = useState(null); // 'manual' | 'ocr'

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeacher(res.data.teacher);
      if (res.data.teacher.classTeacherFor?.length > 0) {
        setSelectedClass(res.data.teacher.classTeacherFor[0]._id);
      }
    } catch (err) {
      showMessage('error', 'Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      showMessage('error', 'Failed to load students');
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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Render Info Tab
  const renderInfoTab = () => (
    <div className="card border-0 shadow-sm rounded-4 p-4">
      <h5 className="text-primary mb-4">
        <User size={20} className="me-2" />
        Teacher Information
      </h5>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Name</label>
          <input
            type="text"
            className="form-control rounded-3 bg-light"
            value={teacher.name}
            disabled
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Email</label>
          <input
            type="email"
            className="form-control rounded-3 bg-light"
            value={teacher.email}
            disabled
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Classes Teaching</label>
          <div className="d-flex flex-wrap gap-2">
            {teacher.classTeacherFor?.map(cls => (
              <span key={cls._id} className="badge bg-primary px-3 py-2">
                {cls.name}
              </span>
            ))}
            {teacher.classTeacherFor?.length === 0 && (
              <span className="text-muted">No classes assigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Students Tab
  const renderStudentsTab = () => (
    <div>
      {/* Class Selector */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="row align-items-center">
          <div className="col-md-8">
            <select
              className="form-select rounded-3"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {teacher.classTeacherFor?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 text-end">
            <button
              className="btn btn-primary rounded-3"
              onClick={() => setShowAddStudents(true)}
              disabled={!selectedClass}
            >
              <Plus size={18} className="me-2" />
              Add Students
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      {students.length > 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Reg No</th>
                  <th>Parent Phone</th>
                  <th>Fee</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
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
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            name: e.target.value
                          })}
                        />
                      ) : (
                        <strong>{student.name}</strong>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">{student.regNo}</small>
                    </td>
                    <td>
                      {editingStudent?._id === student._id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editingStudent.parentPhone || ''}
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            parentPhone: e.target.value
                          })}
                        />
                      ) : (
                        <small>{student.parentPhone || 'N/A'}</small>
                      )}
                    </td>
                    <td>₦{student.classFee?.toLocaleString()}</td>
                    <td>
                      {editingStudent?._id === student._id ? (
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editingStudent.amountPaid || 0}
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            amountPaid: parseFloat(e.target.value) || 0
                          })}
                        />
                      ) : (
                        <span className={student.amountPaid > 0 ? 'text-success' : 'text-muted'}>
                          ₦{student.amountPaid?.toLocaleString() || 0}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        student.paymentStatus === 'paid' ? 'bg-success' :
                        student.paymentStatus === 'partial' ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {student.paymentStatus}
                      </span>
                    </td>
                    <td className="text-center">
                      {editingStudent?._id === student._id ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success rounded-start-3"
                            onClick={() => handleUpdateStudent(student._id, {
                              name: editingStudent.name,
                              parentPhone: editingStudent.parentPhone,
                              amountPaid: editingStudent.amountPaid
                            })}
                          >
                            <Save size={14} />
                          </button>
                          <button
                            className="btn btn-secondary rounded-end-3"
                            onClick={() => setEditingStudent(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => setEditingStudent({ ...student })}
                        >
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
          {selectedClass ? 'No students in this class yet.' : 'Select a class to view students.'}
        </div>
      )}
    </div>
  );

  // Add Students Modal
  const renderAddStudentsModal = () => (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title text-primary">Add Students</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setShowAddStudents(false);
                setAddMethod(null);
              }}
            ></button>
          </div>
          <div className="modal-body">
            {!addMethod ? (
              <div className="text-center py-4">
                <h6 className="mb-4">Choose Method</h6>
                <div className="d-flex gap-3 justify-content-center">
                  <button
                    className="btn btn-primary btn-lg rounded-3"
                    onClick={() => setAddMethod('ocr')}
                  >
                    <Camera size={20} className="me-2" />
                    Scan (OCR)
                  </button>
                  <button
                    className="btn btn-secondary btn-lg rounded-3"
                    onClick={() => setAddMethod('manual')}
                  >
                    <Edit size={20} className="me-2" />
                    Manual Entry
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

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-primary d-flex align-items-center">
          <User size={32} className="me-2" />
          My Profile
        </h2>
        <p className="text-muted">Manage your profile and students</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3`}>
          {message.text}
        </div>
      )}

      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link rounded-3 ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={18} className="me-2" />
            Information
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-3 ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={18} className="me-2" />
            Manage Students
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