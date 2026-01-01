// src/components/common/Footer.js
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white mt-auto py-4">
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-md-8 mb-3 mb-md-0">
            <h5 className="fw-bold mb-2">Scoolynk</h5>
            <p className="mb-2 small text-white-50">
              A comprehensive school management system designed to streamline administrative tasks, 
              manage student records, track results, and facilitate seamless communication between 
              teachers and administrators.
            </p>
            <p className="mb-0 small text-white-50">
              © {currentYear} Scoolynk. All rights reserved.
            </p>
          </div>
          <div className="col-md-4 text-md-end">
            <h6 className="fw-bold mb-2">Need Support?</h6>
            <p className="mb-2 small text-white-50">
              Contact us for assistance with the platform
            </p>
            <div className="d-flex align-items-center justify-content-md-end gap-2">
              <i className="bi bi-telephone-fill text-primary"></i>
              <a href="tel:09123140961" className="text-white text-decoration-none fw-bold">
                09123140961
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;