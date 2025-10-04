// src/components/common/Layout.js
import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';
const Layout = ({ user, role, children }) => {
  return (
    <div className="main-content d-flex">
      <Sidebar user={user} role={role} />
      <main className="flex-grow-1 p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
