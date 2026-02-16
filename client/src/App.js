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

// src/App.js - IMPROVED ProtectedRoute

const ProtectedRoute = ({ children, roles }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const validateAuth = async () => {
      console.log('[ProtectedRoute] Starting validation...');
      
      const user = getUser();
      const token = getAccessToken();
      const refreshToken = localStorage.getItem('refreshToken');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      console.log('[ProtectedRoute] Auth state:', {
        hasUser: !!user,
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        rememberMe
      });

      // ✅ If no token but we have refreshToken and rememberMe, try to refresh
      if ((!user || !token) && refreshToken && rememberMe) {
        console.log('[ProtectedRoute] No active session, attempting auto-refresh...');
        const refreshed = await autoRefreshToken();
        console.log('[ProtectedRoute] Refresh result:', refreshed);
        setIsAuthenticated(refreshed);
      } 
      // ✅ If we have user and token, check if token is expiring
      else if (user && token) {
        if (isTokenExpiringSoon()) {
          console.log('[ProtectedRoute] Token expiring soon, refreshing...');
          const refreshed = await autoRefreshToken();
          console.log('[ProtectedRoute] Refresh result:', refreshed);
          setIsAuthenticated(refreshed);
        } else {
          console.log('[ProtectedRoute] Valid session found');
          setIsAuthenticated(true);
        }
      } 
      // ✅ No valid session and can't refresh
      else {
        console.log('[ProtectedRoute] No valid session, redirecting to login');
        setIsAuthenticated(false);
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
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  if (!user) {
    console.log('[ProtectedRoute] No user found after authentication, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    console.log('[ProtectedRoute] User must change password');
    return <Navigate to="/reset-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('[ProtectedRoute] User role not authorized, redirecting to user dashboard');
    return <Navigate to={`/${user.role}`} replace />;
  }

  console.log('[ProtectedRoute] Access granted');
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