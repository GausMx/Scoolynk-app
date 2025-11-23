// src/components/Teacher/TeacherDashboard.js - COMPLETE WITH AUTO-REFRESH

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import TeacherHome from './TeacherHome';
import MyClassWithResults from './MyClassWithResults';
import ClassView from './ClassView';
import TeacherProfile from './TeacherProfile';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);

  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Initial data fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✅ Auto-refresh when navigating back to teacher home
  useEffect(() => {
    if (location.pathname === '/teacher' && teacherData) {
      console.log('[TeacherDashboard] Auto-refreshing on home navigation');
      fetchDashboardData();
    }
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[TeacherDashboard] Dashboard data fetched:', res.data);
      setLoadingPercent(70);

      setTeacherData(res.data);
      setLoadingPercent(100);
    } catch (err) {
      console.error('[TeacherDashboard] Failed to load dashboard:', err);
      if (err.response?.status === 401) {
        console.log('[TeacherDashboard] Unauthorized - redirecting to login');
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // ✅ Manual refresh function that can be called from child components
  const refreshDashboard = () => {
    console.log('[TeacherDashboard] Manual refresh triggered');
    fetchDashboardData();
  };

  if (loading && !teacherData) {
    return <Loading percentage={loadingPercent} />;
  }

  if (!teacherData) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger rounded-3">
          Failed to load dashboard. Please refresh the page or try logging in again.
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar user={user} role="teacher" />
      <div className="flex-grow-1">
        <Navbar user={user} role="teacher" />
        <div className="p-0">
          <Routes>
            <Route 
              path="/" 
              element={
                <TeacherHome 
                  teacherData={teacherData} 
                  refreshData={refreshDashboard} // ✅ Pass refresh function to home
                />
              } 
            />
            <Route 
              path="/my-class" 
              element={<MyClassWithResults refreshDashboard={refreshDashboard} />} // ✅ Pass refresh function
            />
            <Route 
              path="/class/:classId" 
              element={<ClassView />} 
            />
            <Route 
              path="/teacher-profile" 
              element={<TeacherProfile />} 
            />
            <Route path="*" element={<Navigate to="/teacher" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;