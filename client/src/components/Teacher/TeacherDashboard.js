// src/components/Teacher/TeacherDashboard.js

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import TeacherHome from './TeacherHome';
import MyClass from './MyClass';
import ClassView from './ClassView';
import TeacherProfile from './TeacherProfile';
const { REACT_APP_API_URL } = process.env;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [token, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeacherData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="alert alert-danger m-4">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  return (
    <Layout user={{ name: teacherData.teacher.name }} role="teacher">
      <Routes>
        <Route path="/" element={<TeacherHome teacherData={teacherData} refreshData={fetchDashboardData} />} />
        <Route path="/my-class" element={<MyClass />} />
        <Route path="/class/:classId" element={<ClassView />} />
        <Route path="/profile" element={<TeacherProfile teacher={teacherData.teacher} refreshData={fetchDashboardData} />} />
      </Routes>
    </Layout>
  );
};

export default TeacherDashboard;