// src/components/common/Layout.js
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ user, role, children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header role={role} />
      
      <main className="flex-grow-1" style={{ marginTop: '80px' }}>
        <div className="container-fluid">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;