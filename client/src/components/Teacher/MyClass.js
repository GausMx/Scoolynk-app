// src/components/Teacher/MyClass.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, Download, Plus } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const MyClass = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [classTeacherFor, setClassTeacherFor] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/my-class/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.message) {
        setMessage(res.data.message);
      }
      setStudents(res.data.students || []);
      
      // Extract unique classes the teacher is class teacher for
      const uniqueClasses = [...new Set(res.data.students?.map(s => s.classId))].filter(Boolean);
      setClassTeacherFor(uniqueClasses);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setMessage('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group students by class
  const studentsByClass = filteredStudents.reduce((acc, student) => {
    const className = student.classId?.name || 'Unknown';
    const classId = student.classId?._id || 'unknown';
    if (!acc[classId]) {
      acc[classId] = {
        name: className,
        students: []
      };
    }
    acc[classId].students.push(student);
    return acc;
  }, {});

  const exportToCSV = (className, studentsData) => {
    const csvContent = [
      ['#', 'Name', 'Registration Number'],
      ...studentsData.map((s, i) => [i + 1, s.name, s.regNo])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}_students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            <Users className="me-2" size={32} />
            My Class Students
          </h2>
          <p className="text-muted">
            You are class teacher for: {classTeacherFor.map(c => c.name).join(', ') || 'No classes assigned'}
          </p>
        </div>
      </div>

      {message && students.length === 0 && (
        <div className="alert alert-info rounded-3">{message}</div>
      )}

      {students.length > 0 && (
        <>
          {/* Search Bar */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light rounded-start-pill border-0">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  className="form-control rounded-end-pill"
                  placeholder="Search by name or registration number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Students List by Class */}
          {Object.keys(studentsByClass).map((classId) => {
            const classData = studentsByClass[classId];
            return (
              <div key={classId} className="card shadow-sm rounded-4 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title mb-0 text-primary">{classData.name}</h4>
                    <button 
                      className="btn btn-sm btn-outline-primary rounded-3"
                      onClick={() => exportToCSV(classData.name, classData.students)}
                    >
                      <Download size={16} className="me-1" />
                      Export CSV
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Registration Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classData.students.map((student, index) => (
                          <tr key={student._id}>
                            <td>{index + 1}</td>
                            <td className="fw-semibold">{student.name}</td>
                            <td>{student.regNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Total Students: {classData.students.length}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {students.length === 0 && !message && (
        <div className="alert alert-warning rounded-3">
          <p className="mb-2">No students found in your class.</p>
          <small>Students will appear here after you add them during onboarding or from your profile settings.</small>
        </div>
      )}
    </div>
  );
};

export default MyClass;