// src/components/Teacher/ClassView.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Award } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const ClassView = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      
      // Fetch class details
      const classRes = await axios.get(`${REACT_APP_API_URL}/api/admin/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const currentClass = classRes.data.classes.find(c => c._id === classId);
      setClassData(currentClass);

      // Fetch students in this class
      const studentsRes = await axios.get(`${REACT_APP_API_URL}/api/teacher/my-class/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const classStudents = studentsRes.data.students.filter(s => s.classId._id === classId);
      setStudents(classStudents);

      // Fetch courses for this class
      const coursesRes = await axios.get(`${REACT_APP_API_URL}/api/admin/classes/${classId}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(coursesRes.data.courses || []);
      
    } catch (err) {
      console.error('Failed to fetch class data:', err);
      setMessage('Failed to load class information.');
    } finally {
      setLoading(false);
    }
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

  if (!classData) {
    return (
      <div className="alert alert-danger rounded-3">
        Class not found or you don't have access to this class.
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-2">
            <BookOpen className="me-2" size={32} />
            {classData.name}
          </h2>
          <p className="text-muted">Class Fee: ₦{classData.fee.toLocaleString()}</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-info rounded-3">{message}</div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
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

        <div className="col-md-4">
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

        <div className="col-md-4">
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
                        <th>Course Name</th>
                        <th>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course._id}>
                          <td className="fw-semibold">{course.name}</td>
                          <td>{course.teacher?.name || 'Not Assigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No courses assigned to this class yet.</p>
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
              <h4 className="card-title mb-3">
                <Users className="me-2" size={24} />
                Students in {classData.name}
              </h4>
              {students.length > 0 ? (
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
                      {students.map((student, index) => (
                        <tr key={student._id}>
                          <td>{index + 1}</td>
                          <td className="fw-semibold">{student.name}</td>
                          <td>{student.regNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No students enrolled in this class yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassView;