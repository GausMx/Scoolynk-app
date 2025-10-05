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

  const displayName = user ? (role === 'admin' ? user.schoolName : user.name) : '';

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="btn btn-dark d-md-none mb-3"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileSidebar"
        aria-controls="mobileSidebar"
      >
        ☰
      </button>

      {/* Desktop sidebar */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{ width: '250px', height: '100vh', position: 'sticky', top: 0 }}
      >
        <h5 className="mb-3">{displayName || 'Loading...'}</h5>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          {links.map((link) => (
            <li className="nav-item" key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active text-white' : 'text-white'}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <small>{displayName || ''}</small>
        </div>
      </div>

      {/* Mobile offcanvas */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white d-md-none"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileSidebarLabel">
            {displayName || 'Loading...'}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav nav-pills flex-column">
            {links.map((link) => (
              <li className="nav-item" key={link.path}>
                <Link
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? 'active text-white' : 'text-white'}`}
                  data-bs-dismiss="offcanvas"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <small>{displayName || ''}</small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
