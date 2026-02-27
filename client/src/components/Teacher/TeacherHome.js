// src/components/Teacher/TeacherHome.jsx
// Clean, modern teacher dashboard.
// Reads teacher.courses directly from teacherData — NO extra API calls.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, PenLine, UserCircle,
  CalendarDays, ChevronRight, Star
} from 'lucide-react';

const TeacherHome = ({ teacherData }) => {
  const navigate  = useNavigate();
  const teacher   = teacherData?.teacher  || {};
  const school    = teacherData?.school   || {};
  const stats     = teacherData?.stats    || {};

  const activeTerm    = school.currentTerm    || null;
  const activeSession = school.currentSession || null;

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: 860 }}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <h4 className="fw-bold mb-0">
          Welcome back, {teacher.name?.split(' ')[0] || teacher.name} 👋
        </h4>
        <p className="text-muted small mb-0">{today}</p>
        {activeTerm && (
          <div className="d-inline-flex align-items-center gap-2 mt-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary" style={{ fontSize: 13 }}>
            <CalendarDays size={13} />
            <span><strong>{activeTerm}</strong>{activeSession ? ` · ${activeSession}` : ''}</span>
          </div>
        )}
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card border-0 shadow-sm rounded-4 bg-primary text-white h-100">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="bg-white bg-opacity-25 rounded-3 p-2 flex-shrink-0">
                <Users size={20} />
              </div>
              <div>
                <div className="opacity-75" style={{ fontSize: 12 }}>My Students</div>
                <div className="fw-bold fs-4 lh-1">{stats.totalStudents ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card border-0 shadow-sm rounded-4 bg-success text-white h-100">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="bg-white bg-opacity-25 rounded-3 p-2 flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="opacity-75" style={{ fontSize: 12 }}>Classes</div>
                <div className="fw-bold fs-4 lh-1">{stats.classesTeaching ?? teacher.classes?.length ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Classes & Subjects ───────────────────────────────────────────── */}
      <div className="row g-3 mb-4">

        {/* My Classes */}
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <BookOpen size={15} className="text-primary" /> My Classes
                </h6>
                {teacher.classTeacherFor?.length > 0 && (
                  <button
                    className="btn btn-link btn-sm p-0 text-primary d-flex align-items-center gap-1 text-decoration-none"
                    style={{ fontSize: 12 }}
                    onClick={() => navigate('/teacher/my-class')}
                  >
                    Manage <ChevronRight size={13} />
                  </button>
                )}
              </div>

              {teacher.classes?.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {teacher.classes.map(cls => {
                    const isClassTeacher = teacher.classTeacherFor?.some(
                      c => (c._id || c).toString() === (cls._id || cls).toString()
                    );
                    return (
                      <div key={cls._id}
                        className="d-flex align-items-center justify-content-between px-3 py-2 bg-light rounded-3">
                        <div>
                          <span className="fw-semibold small">{cls.name}</span>
                          {isClassTeacher && (
                            <span className="badge bg-success-subtle text-success ms-2" style={{ fontSize: 10 }}>
                              Class Teacher
                            </span>
                          )}
                        </div>
                        <ChevronRight size={13} className="text-muted" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted small mb-0">No classes assigned yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* My Subjects — from teacher.courses directly, no extra fetch */}
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <Star size={15} className="text-success" /> My Subjects
                </h6>
                <span className="badge bg-success-subtle text-success" style={{ fontSize: 11 }}>
                  {teacher.courses?.length ?? 0}
                </span>
              </div>

              {teacher.courses?.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {teacher.courses.map((course, i) => (
                    <span key={i}
                      className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill"
                      style={{ fontSize: 12 }}>
                      {course}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted small mb-0">No subjects assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-3">
          <h6 className="fw-bold mb-3">Quick Actions</h6>
          <div className="row g-2">
            <div className="col-4">
              <ActionBtn
                icon={<Users size={20} />}
                label="My Class"
                color="primary"
                onClick={() => navigate('/teacher/my-class')}
              />
            </div>
            <div className="col-4">
              <ActionBtn
                icon={<PenLine size={20} />}
                label="Score Entry"
                color="success"
                onClick={() => navigate('/teacher/subject-score-entry')}
              />
            </div>
            <div className="col-4">
              <ActionBtn
                icon={<UserCircle size={20} />}
                label="My Profile"
                color="secondary"
                onClick={() => navigate('/teacher/teacher-profile')}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

const ActionBtn = ({ icon, label, color, onClick }) => (
  <button
    className={`btn btn-outline-${color} w-100 rounded-3 py-3 d-flex flex-column align-items-center gap-2`}
    onClick={onClick}
    style={{ minHeight: 80 }}
  >
    {icon}
    <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
  </button>
);

export default TeacherHome;