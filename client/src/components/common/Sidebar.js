import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, role }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const adminLinks = [
    { path: '/', label: 'Home' },
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
    <nav className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <button className="btn btn-sm btn-outline-primary d-md-none" onClick={toggleSidebar}>
        ☰
      </button>
      <ul className="nav flex-column">
        {links.map(link => (
          <li key={link.path} className="nav-item">
            <Link
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              to={link.path}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer mt-auto p-3">
        {role === 'admin' ? <small>{user?.schoolName}</small> : <small>{user?.name}</small>}
      </div>
    </nav>
  );
};

export default Sidebar;
