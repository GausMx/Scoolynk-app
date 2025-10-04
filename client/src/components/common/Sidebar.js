// src/components/common/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, role }) => {
  const location = useLocation();

  const adminLinks = [
    { path: '/admin', label: 'Home' },
    { path: '/admin/review-results', label: 'Review Results' },
    { path: '/admin/broadcast', label: 'Broadcast Notification' },
    { path: '/admin/settings', label: 'Settings' },
  ];

  const parentLinks = [
    { path: '/parent', label: 'Dashboard' },
    { path: '/parent/notifications', label: 'Notifications' },
    { path: '/parent/results', label: 'Results' },
    { path: '/parent/payments', label: 'Payments' },
  ];

  const teacherLinks = [
    { path: '/teacher', label: 'Dashboard' },
    { path: '/teacher/grade-input', label: 'Grade Input' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : parentLinks;

  return (
    <>
      {/* Toggle button visible only on mobile */}
      <button
        className="btn btn-dark d-md-none mb-3"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
      >
        ☰
      </button>

      {/* Sidebar Offcanvas */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white d-md-flex flex-column flex-shrink-0 p-3"
        tabIndex="-1"
        id="sidebarOffcanvas"
        aria-labelledby="sidebarLabel"
        style={{ width: '250px' }}
      >
        <h5 className="offcanvas-title mb-3" id="sidebarLabel">
          {role === 'admin' ? user?.schoolName : user?.name}
        </h5>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          {links.map((link) => (
            <li className="nav-item" key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active text-white' : 'text-white'}`}
                data-bs-dismiss="offcanvas" // closes sidebar on mobile after click
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <small>{role === 'admin' ? user?.schoolName : user?.name}</small>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
