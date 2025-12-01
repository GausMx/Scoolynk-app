// src/components/common/Sidebar.js

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const Sidebar = ({ user, role }) => {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [userName, setUserName] = useState('');
  const [navHeight, setNavHeight] = useState(0);

  const navRef = useRef(null);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchSchoolName();
  }, [role]);

  useEffect(() => {
    if (role === 'teacher') fetchTeacherClasses();
  }, [role]);

  useEffect(() => {
    if (navRef.current) setNavHeight(navRef.current.offsetHeight);
  }, [schoolName, isNavOpen]);

  const fetchSchoolName = async () => {
    try {
      const authToken = localStorage.getItem('accessToken');
      if (role === 'admin') {
        const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSchoolName(res.data.school?.name || '');
        setUserName(res.data.admin?.name || '');
      } else if (role === 'teacher') {
        const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSchoolName(res.data.school?.name || '');
        setUserName(res.data.teacher?.name || '');
      }
    } catch (err) {
      console.error('Failed to fetch school name:', err);
    }
  };

  const fetchTeacherClasses = async () => {
    try {
      const authToken = localStorage.getItem('accessToken');
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` }
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

  const teacherLinks = [
    { path: "/teacher", label: "Dashboard" },
    ...(isClassTeacher ? [{ path: "/teacher/my-class", label: "My Class" }] : []),
    { path: "/teacher/teacher-profile", label: "My Profile" },
  ];

  const links =
    role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : [];

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <>
      {/* ================= Desktop Sidebar ================= */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{
          width: "250px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          overflowY: "auto"
        }}
      >
        <h5 className="mb-3">{schoolName || "SCOOLYNK"}</h5>
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
          <small>{userName || ''}</small>
        </div>
      </div>

      {/* ================= Mobile Navbar ================= */}
      <nav
        ref={navRef}
        className="navbar navbar-expand-sm bg-dark navbar-dark d-md-none fixed-top border-0 shadow-sm"
      >
        <div className="container-fluid">
          <span className="navbar-brand">{schoolName || "Scoolynk"}</span>
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

      {/* Spacer for mobile content */}
      <div className="d-md-none" style={{ marginTop: navHeight + 10 }}></div>

      {/* Global Styles */}
      <style>{`
        html, body, #root {
          overflow-x: hidden !important;
        }

        @media (max-width: 768px) {
          nav.navbar {
            border: none !important;
            box-shadow: none !important;
          }
          .navbar-toggler:focus {
            box-shadow: none !important;
          }
          .navbar-collapse.show {
            background: #212529;
          }
        }

        @media (min-width: 768px) {
          /* Content container needs left margin to accommodate fixed sidebar */
          .content-container {
            margin-left: 250px;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
