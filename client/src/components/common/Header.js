// src/components/common/Header.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const Header = ({ role }) => {
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

  return (
    <header className="bg-primary text-white shadow-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1030 }}>
      <div className="container-fluid py-3 px-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <div className="text-center text-md-start">
            <h4 className="mb-0 fw-bold">{schoolName}</h4>
            <p className="mb-0 small text-white-50">{schoolMotto}</p>
          </div>
          <div className="text-center text-md-end">
            <p className="mb-0 small">{currentDate}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;