// src/components/Teacher/TeacherHome.js

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Calendar } from 'lucide-react';

const TeacherHome = ({ teacherData, refreshData }) => {
  const { teacher, coursesDetailed, students } = teacherData;

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">Welcome, {teacher.name}!</h2>
          {teacher.classTeacherFor && teacher.classTeacherFor.length > 0 && (
            <div className="alert alert-success rounded-3">
              <strong>Class Teacher for:</strong> {teacher.classTeacherFor.map(c => c.name).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Classes</h6>
                  <h3 className="mb-0">{teacher.classes?.length || 0}</h3>
                </div>
                <BookOpen size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Courses</h6>
                  <h3 className="mb-0">{teacher.courses?.length || 0}</h3>
                </div>
                <Award size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Students</h6>
                  <h3 className="mb-0">{students?.length || 0}</h3>
                </div>
                <Users size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Class Teacher</h6>
                  <h3 className="mb-0">{teacher.classTeacherFor?.length || 0}</h3>
                </div>
                <Calendar size={40} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Overview */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm rounded-4">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <BookOpen className="me-2" size={24} />
                My Courses
              </h4>
              {coursesDetailed && coursesDetailed.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Course Name</th>
                        <th>Classes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursesDetailed.map((course) => (
                        <tr key={course._id}>
                          <td className="fw-semibold">{course.name}</td>
                          <td>
                            {course.classes.map(cls => (
                              <span key={cls._id} className="badge bg-secondary me-1">
                                {cls.name}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No courses assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {teacher.classTeacherFor && teacher.classTeacherFor.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm rounded-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <Users className="me-2" size={24} />
                  Quick Actions
                </h4>
                <Link to="/teacher/my-class" className="btn btn-primary rounded-3">
                  <Users className="me-2" size={18} />
                  View My Class Students
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHome;