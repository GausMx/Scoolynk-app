// src/App.js - FIX ROOT ROUTE

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getUser, getAccessToken, redirectByRole } from './components/utils/auth';
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

// ✅ NEW: Root redirect component
const RootRedirect = () => {
  const user = getUser();
  const token = getAccessToken();
  const rememberMe = localStorage.getItem('rememberMe') === 'true';

  // If user is logged in, redirect to their dashboard
  if (user && token && rememberMe) {
    return <Navigate to={redirectByRole(user.role)} replace />;
  }

  // Otherwise go to login
  return <Navigate to="/login" replace />;
};

const ProtectedRoute = ({ children, roles }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const validateAuth = async () => {
      const user = getUser();
      const token = getAccessToken();
      const refreshToken = localStorage.getItem('refreshToken');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      if (!token && refreshToken && rememberMe) {
        const refreshed = await autoRefreshToken();
        if (refreshed) {
          const refreshedUser = getUser();
          setIsAuthenticated(!!refreshedUser);
        } else {
          setIsAuthenticated(false);
        }
      } 
      else if (token && user) {
        if (isTokenExpiringSoon()) {
          const refreshed = await autoRefreshToken();
          setIsAuthenticated(refreshed);
        } else {
          setIsAuthenticated(true);
        }
      } 
      else {
        setIsAuthenticated(false);
      }
      
      setIsValidating(false);
    };

    validateAuth();
  }, []);

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/reset-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    const cleanup = setupAutoRefresh();

    if ('serviceWorker' in navigator) {
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      }, 30000);

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      });

      return () => {
        clearInterval(updateInterval);
        cleanup();
      };
    }

    return cleanup;
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
        {/* ✅ FIXED: Root now checks auth and redirects appropriately */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Auth routes */}
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

