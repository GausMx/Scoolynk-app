// src/components/Teacher/TeacherHome.js - WITH ACTUAL COURSES

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, BookOpen, FileText, Clock, 
  TrendingUp, Award, Calendar, ChevronRight 
} from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const TeacherHome = ({ teacherData, refreshData }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingResults: 0,
    submittedResults: 0,
    classesTeaching: 0
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCoursesAndStats();
  }, []);

  const fetchCoursesAndStats = async () => {
    try {
      setLoading(true);

      // Fetch courses for all classes the teacher teaches
      const classIds = teacherData.teacher.classes?.map(c => c._id) || [];
      const coursePromises = classIds.map(classId =>
        axios.get(
          `${REACT_APP_API_URL}/api/teacher/class/${classId}/courses`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => ({ data: { courses: [] } }))
      );

      const courseResponses = await Promise.all(coursePromises);
      const allCourses = courseResponses.flatMap(res => res.data.courses || []);
      
      // Remove duplicates based on course ID
      const uniqueCourses = Array.from(
        new Map(allCourses.map(course => [course._id, course])).values()
      );
      
      setCourses(uniqueCourses);

      // Calculate stats
      const totalStudents = teacherData.students?.length || 0;
      const classesTeaching = teacherData.teacher.classes?.length || 0;

      // You can fetch pending/submitted results count from API if needed
      // For now, using placeholder values
      setStats({
        totalStudents,
        pendingResults: 0, // TODO: Fetch from API
        submittedResults: 0, // TODO: Fetch from API
        classesTeaching
      });

    } catch (err) {
      console.error('Failed to fetch courses and stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const teacher = teacherData.teacher;

  return (
    <div className="container-fluid py-4">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-primary mb-1">
                Welcome back, {teacher.name}! 👋
              </h2>
              <p className="text-muted mb-0">
                Here's an overview of your teaching activities
              </p>
            </div>
            <div className="text-end d-none d-md-block">
              <div className="badge bg-primary-subtle text-primary px-3 py-2">
                <Calendar size={16} className="me-2" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 bg-primary text-white h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mb-1 opacity-75 small">My Students</p>
                  <h3 className="fw-bold mb-0">{stats.totalStudents}</h3>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <Users size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 bg-success text-white h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mb-1 opacity-75 small">Classes Teaching</p>
                  <h3 className="fw-bold mb-0">{stats.classesTeaching}</h3>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <BookOpen size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 bg-warning text-white h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mb-1 opacity-75 small">Pending Results</p>
                  <h3 className="fw-bold mb-0">{stats.pendingResults}</h3>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <Clock size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 bg-info text-white h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mb-1 opacity-75 small">Submitted Results</p>
                  <h3 className="fw-bold mb-0">{stats.submittedResults}</h3>
                </div>
                <div className="bg-white bg-opacity-25 rounded-3 p-2">
                  <FileText size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Classes Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-primary mb-0">
                  <Users size={20} className="me-2" />
                  My Classes
                </h5>
                <button 
                  className="btn btn-sm btn-outline-primary rounded-3"
                  onClick={() => navigate('/teacher/my-class')}
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div className="list-group list-group-flush">
                {teacher.classes && teacher.classes.length > 0 ? (
                  teacher.classes.map((cls, index) => (
                    <div 
                      key={cls._id} 
                      className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom"
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                          <BookOpen size={20} className="text-primary" />
                        </div>
                        <div>
                          <h6 className="mb-0 fw-semibold">{cls.name}</h6>
                          <small className="text-muted">
                            {teacher.classTeacherFor?.some(c => c._id === cls._id) && 
                              <span className="badge bg-success-subtle text-success me-2">Class Teacher</span>
                            }
                          </small>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-primary rounded-3"
                        onClick={() => navigate(`/teacher/class/${cls._id}`)}
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="alert alert-info mb-0">
                    <p className="mb-0 small">No classes assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Courses/Subjects Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-success mb-0">
                  <Award size={20} className="me-2" />
                  My Courses
                </h5>
                <span className="badge bg-success-subtle text-success px-3 py-2">
                  {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted small mt-2 mb-0">Loading courses...</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {courses.length > 0 ? (
                    courses.map((course, index) => (
                      <div 
                        key={course._id} 
                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom"
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                            <BookOpen size={20} className="text-success" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">{course.name}</h6>
                            <small className="text-muted">
                              {course.classes?.length || 0} {course.classes?.length === 1 ? 'class' : 'classes'}
                            </small>
                          </div>
                        </div>
                        <span className="badge bg-success-subtle text-success">Active</span>
                      </div>
                    ))
                  ) : teacher.courses && teacher.courses.length > 0 ? (
                    // Fallback to courses array from teacher profile if API fails
                    teacher.courses.map((courseName, index) => (
                      <div 
                        key={index} 
                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom"
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                            <BookOpen size={20} className="text-success" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">{courseName}</h6>
                          </div>
                        </div>
                        <span className="badge bg-success-subtle text-success">Active</span>
                      </div>
                    ))
                  ) : (
                    <div className="alert alert-info mb-0">
                      <p className="mb-0 small">No courses assigned yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3 mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold text-primary mb-3">
                <TrendingUp size={20} className="me-2" />
                Quick Actions
              </h5>
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <button 
                    className="btn btn-outline-primary w-100 rounded-3 py-3 h-100"
                    onClick={() => navigate('/teacher/my-class')}
                  >
                    <Users size={24} className="mb-2 d-block mx-auto" />
                    <small className="fw-semibold">Manage Students</small>
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button 
                    className="btn btn-outline-success w-100 rounded-3 py-3 h-100"
                    onClick={() => navigate('/teacher/my-class')}
                  >
                    <FileText size={24} className="mb-2 d-block mx-auto" />
                    <small className="fw-semibold">Enter Results</small>
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button 
                    className="btn btn-outline-info w-100 rounded-3 py-3 h-100"
                    onClick={() => navigate('/teacher/teacher-profile')}
                  >
                    <Award size={24} className="mb-2 d-block mx-auto" />
                    <small className="fw-semibold">My Profile</small>
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button 
                    className="btn btn-outline-warning w-100 rounded-3 py-3 h-100"
                    onClick={() => navigate('/teacher/my-class')}
                  >
                    <Clock size={24} className="mb-2 d-block mx-auto" />
                    <small className="fw-semibold">View History</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;