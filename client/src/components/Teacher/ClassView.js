// src/components/Teacher/ClassView.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Award, Download } from 'lucide-react';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const ClassView = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);
      
      // Fetch all classes to find current one
      const classRes = await axios.get(`${REACT_APP_API_URL}/api/teacher/school-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLoadingPercent(30);
      
      const currentClass = classRes.data.classes.find(c => c._id === classId);
      if (!currentClass) {
        setMessage('Class not found or you do not have access to this class.');
        setLoadingPercent(100);
        setTimeout(() => setLoading(false), 300);
        return;
      }
      setClassData(currentClass);

      setLoadingPercent(50);

      // Fetch students in this specific class
      const studentsRes = await axios.get(`${REACT_APP_API_URL}/api/teacher/class/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(studentsRes.data.students || []);

      setLoadingPercent(70);

      // Fetch courses for this class
      try {
        const coursesRes = await axios.get(
          `${REACT_APP_API_URL}/api/teacher/class/${classId}/courses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCourses(coursesRes.data.courses || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setCourses([]);
      }
      
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch class data:', err);
      setMessage('Failed to load class information.');
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvContent = [
      ['#', 'Name', 'Registration Number'],
      ...students.map((s, i) => [i + 1, s.name, s.regNo])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData?.name || 'class'}_students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  if (!classData) {
    return (
      <div className="alert alert-danger rounded-3 m-4">
        {message || 'Class not found or you don\'t have access to this class.'}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h2 className="mb-2 d-flex align-items-center">
                <BookOpen className="me-2" size={32} />
                {classData.name}
              </h2>
              {classData.fee && (
                <p className="text-muted mb-0">Class Fee: ₦{classData.fee.toLocaleString()}</p>
              )}
            </div>
            {students.length > 0 && (
              <button 
                className="btn btn-outline-primary rounded-3 w-100 w-md-auto"
                onClick={exportToCSV}
              >
                <Download size={18} className="me-2" />
                Export Students
              </button>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="alert alert-info rounded-3">{message}</div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card bg-primary text-white shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Students</h6>
                  <h3 className="mb-0">{students.length}</h3>
                </div>
                <Users size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card bg-success text-white shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Courses</h6>
                  <h3 className="mb-0">{courses.length}</h3>
                </div>
                <Award size={40} />
              </div>
            </div>
          </div>
        </div>

        {classData.fee && (
          <div className="col-12 col-md-4">
            <div className="card bg-info text-white shadow-sm rounded-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Class Fee</h6>
                    <h3 className="mb-0">₦{classData.fee.toLocaleString()}</h3>
                  </div>
                  <BookOpen size={40} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Courses Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <Award className="me-2" size={24} />
                Courses in {classData.name}
              </h4>
              {courses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th className="small">#</th>
                        <th className="small">Course Name</th>
                        <th className="small">Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={course._id}>
                          <td className="small">{index + 1}</td>
                          <td className="fw-semibold small">{course.name}</td>
                          <td className="small">{course.teacher?.name || 'Not Assigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0 small">No courses assigned to this class yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                <h4 className="card-title mb-0">
                  <Users className="me-2" size={24} />
                  Students in {classData.name}
                </h4>
                <div className="input-group w-100 w-md-auto" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-light border-0">
                    <Users size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {students.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th className="small">#</th>
                        <th className="small">Name</th>
                        <th className="small">Registration Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr key={student._id}>
                          <td className="small">{index + 1}</td>
                          <td className="fw-semibold small">{student.name}</td>
                          <td className="small">{student.regNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && searchTerm && (
                    <div className="text-center text-muted py-3 small">
                      No students found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-warning mb-0">
                  <p className="mb-0 small">No students enrolled in this class yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassView;