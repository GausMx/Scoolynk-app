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
  const navRef = useRef(null);

  const token = localStorage.getItem('accessToken');

  useEffect(() => { fetchSchoolName(); }, [role]);
  useEffect(() => { if (role === 'teacher') fetchTeacherClasses(); }, [role]);

  // Adjust page padding based on sidebar/navbar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.style.paddingLeft = "250px"; // sidebar width
        document.body.style.paddingTop = "0px";
      } else {
        document.body.style.paddingLeft = "0px";
        document.body.style.paddingTop = `${navRef.current ? navRef.current.offsetHeight + 10 : 70}px`;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
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

  const links = role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : [];
  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{
          width: "250px",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 1030,
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
                  location.pathname === link.path ? "active text-white" : "text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto"><small>{userName || ''}</small></div>
      </div>

      {/* Mobile Navbar */}
      <nav
        ref={navRef}
        className="navbar navbar-expand-sm bg-dark navbar-dark d-md-none fixed-top"
        style={{ zIndex: 1040 }}
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
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#212529',
              zIndex: 1050,
            }}
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 w-100">
              {links.map((link) => (
                <li className="nav-item" key={link.path}>
                  <Link
                    to={link.path}
                    className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
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

      {/* Overlay for mobile when menu is open */}
      {isNavOpen && (
        <div
          onClick={closeNav}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1039,
            display: window.innerWidth < 768 ? 'block' : 'none',
          }}
        />
      )}

      {/* Global Styles */}
      <style>{`
        html, body, #root { 
          overflow-x: hidden !important; 
        }

        @media (max-width: 768px) {
          nav.navbar {
            border: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            outline: none !important;
          }
          
          .navbar-toggler:focus { 
            box-shadow: none !important; 
          }
          
          .navbar-collapse {
            max-height: calc(100vh - 56px);
            overflow-y: auto;
          }
          
          .navbar-collapse.show { 
            background: #212529 !important; 
            width: 100% !important; 
            flex-direction: column !important;
            padding: 0.5rem 0 !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2) !important;
          }
          
          .navbar-nav { 
            flex-direction: column !important; 
            width: 100% !important; 
          }
          
          .navbar-nav .nav-item { 
            margin-left: 0 !important; 
            width: 100% !important;
          }
          
          .navbar-nav .nav-link {
            padding: 0.75rem 1rem !important;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          
          .navbar-nav .nav-link:hover {
            background-color: rgba(255,255,255,0.1);
          }
          
          .navbar-nav .nav-link.active {
            background-color: rgba(255,255,255,0.2);
          }
          
          nav.navbar:focus, nav.navbar *:focus { 
            outline: none !important; 
          }

          /* Ensure main content doesn't overlap */
          .container-fluid {
            position: relative;
            z-index: 1;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;