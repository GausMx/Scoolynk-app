// src/components/common/Sidebar.js

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const Sidebar = ({ user, role }) => {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  const token = localStorage.getItem('token');

  // Fetch school name for both admin and teacher
  useEffect(() => {
    fetchSchoolName();
  }, [role]);

  // Fetch teacher's classes if role is teacher
  useEffect(() => {
    if (role === 'teacher') {
      fetchTeacherClasses();
    }
  }, [role]);

  const fetchSchoolName = async () => {
    try {
      if (role === 'admin') {
        const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSchoolName(res.data.school?.name || 'SCOOLYNK');
      } else if (role === 'teacher') {
        const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSchoolName(res.data.school?.name || 'SCOOLYNK');
      }
    } catch (err) {
      console.error('Failed to fetch school name:', err);
      setSchoolName('SCOOLYNK');
    }
  };

  const fetchTeacherClasses = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const teacherData = res.data;
      setTeacherClasses(teacherData.teacher.classes || []);
      setIsClassTeacher(teacherData.teacher.classTeacherFor && teacherData.teacher.classTeacherFor.length > 0);
    } catch (err) {
      console.error('Failed to fetch teacher classes:', err);
    }
  };

  const adminLinks = [
    { path: "/admin", label: "Home" },
    { path: "/admin/manage-teachers", label: "Manage Teachers" },
    { path: "/admin/manage-students", label: "Manage Students" },
    { path: "/admin/manage-classes", label: "Manage Classes" },
    { path: "/admin/manage-courses", label: "Manage Courses" },
    { path: "/admin/payment-setup", label: "Payment Setup" },
    { path: "/admin/payment-history", label: "Payment History" },
    { path: "/admin/result-management", label: "Result Management" },
    { path: "/admin/settings", label: "Settings" },
    { path: "/admin/template-builder", label: "Template Builder" }
  ];

  // Dynamic teacher links based on their classes
  const teacherLinks = [
    { path: "/teacher", label: "Dashboard" },
    ...(isClassTeacher ? [{ path: "/teacher/my-class", label: "My Class" }] : []),
    ...teacherClasses.map((cls) => ({
      path: `/teacher/class/${cls._id}`,
      label: cls.name,
    })),
    { path: "/teacher/teacher-profile", label: "My Profile" },
  ];

  const links =
    role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : [];

  const displayName = schoolName || "SCOOLYNK";

  // Toggle collapse manually
  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <>
      {/* ================= Desktop Sidebar ================= */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{ width: "250px", height: "100vh", position: "sticky", top: 0 }}
      >
        <h5 className="mb-3">{displayName}</h5>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          {links.map((link) => (
            <li className="nav-item" key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${
                  location.pathname === link.path
                    ? "active text-white"
                    : "text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <small>{user?.name || displayName}</small>
        </div>
      </div>

      {/* ================= Mobile Navbar ================= */}
      <nav className="navbar navbar-expand-sm bg-dark navbar-dark d-md-none fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">{displayName}</span>
          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleNav}
            aria-controls="mobileNav"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`}
            id="mobileNav"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {links.map((link) => (
                <li className="nav-item" key={link.path}>
                  <Link
                    to={link.path}
                    className={`nav-link ${
                      location.pathname === link.path ? "active" : ""
                    }`}
                    onClick={closeNav}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Add margin so page content doesn't hide under navbar */}
      <div className="d-md-none" style={{ marginTop: "70px" }}></div>
    </>
  );
};

export default Sidebar;