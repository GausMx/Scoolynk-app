// src/components/common/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const Header = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [schoolName, setSchoolName] = useState('');
  const [schoolMotto, setSchoolMotto] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    fetchSchoolInfo();
    updateDate();
    const dateInterval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(dateInterval);
  }, [role]);

  const updateDate = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  };

  const fetchSchoolInfo = async () => {
    try {
      const authToken = localStorage.getItem('accessToken');
      if (role === 'admin') {
        const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSchoolName(res.data.school?.name || 'SCOOLYNK');
        setSchoolMotto(res.data.school?.motto || 'Excellence in Education');
      } else if (role === 'teacher') {
        const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSchoolName(res.data.school?.name || 'SCOOLYNK');
        setSchoolMotto(res.data.school?.motto || 'Excellence in Education');
      }
    } catch (err) {
      console.error('Failed to fetch school info:', err);
      setSchoolName('SCOOLYNK');
      setSchoolMotto('Excellence in Education');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'teacher') {
      navigate('/teacher');
    }
  };

  // Check if we're on the home page
  const isHomePage = () => {
    if (role === 'admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    } else if (role === 'teacher') {
      return location.pathname === '/teacher' || location.pathname === '/teacher/';
    }
    return false;
  };

  return (
    <header className="bg-primary text-white shadow-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1030 }}>
      <div className="container-fluid py-3 px-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          {/* Left Section - Navigation */}
          <div className="d-flex align-items-center gap-2">
            {!isHomePage() && (
              <button 
                onClick={handleGoBack}
                className="btn btn-sm btn-light text-primary d-flex align-items-center gap-1"
                title="Go back"
              >
                <i className="bi bi-arrow-left"></i>
                <span className="d-none d-sm-inline">Back</span>
              </button>
            )}
            <button 
              onClick={handleGoHome}
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
              title="Go to home"
            >
              <i className="bi bi-house-door"></i>
              <span className="d-none d-sm-inline">Home</span>
            </button>
          </div>

          {/* Center Section - School Info */}
          <div className="text-center">
            <h4 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>{schoolName}</h4>
            <p className="mb-0 small text-white-50 d-none d-md-block">{schoolMotto}</p>
          </div>

          {/* Right Section - Date */}
          <div className="text-center text-md-end">
            <p className="mb-0 small">{currentDate}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;