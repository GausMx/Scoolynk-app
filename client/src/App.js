// src/App.js - UPDATED WITH AUTO-REFRESH

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getUser, getAccessToken } from './components/utils/auth';
import { autoRefreshToken, setupAutoRefresh, isTokenExpiringSoon } from './utils/authRefresh';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages & Auth
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import TeacherOnboarding from './components/Teacher/TeacherOnboarding';
import AdminDashboard from './components/pages/AdminDashboard';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PasswordResetForm from './components/Auth/PasswordResetForm';
import PublicPaymentPage from './components/public/PublicPaymentPage';
import PaymentVerification from './components/public/PaymentVerification';

// Parent Components
import ParentDashboard from './components/Parent/ParentDashboard';
import ChildResults from './components/Parent/ChildResults';
import ResultDetails from './components/Parent/ResultDetails';
import PerformanceAnalytics from './components/Parent/PerformanceAnalytics';

// ✅ UPDATED: ProtectedRoute with auto-refresh
const ProtectedRoute = ({ children, roles }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const validateAuth = async () => {
      const user = getUser();
      const token = getAccessToken();
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      if (!user || !token) {
        // No user or token - check if we can auto-refresh
        if (rememberMe) {
          console.log('[ProtectedRoute] No token, attempting auto-refresh...');
          const refreshed = await autoRefreshToken();
          setIsAuthenticated(refreshed);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        // User exists - check if token is expiring soon
        if (isTokenExpiringSoon()) {
          console.log('[ProtectedRoute] Token expiring soon, refreshing...');
          const refreshed = await autoRefreshToken();
          setIsAuthenticated(refreshed);
        } else {
          setIsAuthenticated(true);
        }
      }
      
      setIsValidating(false);
    };

    validateAuth();
  }, []);

  // Show loading spinner while validating
  if (isValidating) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  if (user.mustChangePassword) {
    return <Navigate to="/reset-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const App = () => {
  // ✅ Setup automatic token refresh on app mount
  useEffect(() => {
    console.log('[App] Setting up auto-refresh...');
    const cleanup = setupAutoRefresh();
    return cleanup; // Cleanup interval on unmount
  }, []);

  return (
    <Router>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/reset-password" element={<PasswordResetForm />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
        <Route path="/teacher/onboarding" element={<TeacherOnboarding />} />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Parent routes */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/children/:studentId/results"
          element={
            <ProtectedRoute roles={['parent']}>
              <ChildResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/children/:studentId/analytics"
          element={
            <ProtectedRoute roles={['parent']}>
              <PerformanceAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/results/:resultId"
          element={
            <ProtectedRoute roles={['parent']}>
              <ResultDetails />
            </ProtectedRoute>
          }
        />

        {/* Public payment routes */}
        <Route path="/pay/:token" element={<PublicPaymentPage />} />
        <Route path="/payment/verify" element={<PaymentVerification />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;