// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// pages & auth
import AdminDashboard from './components/pages/AdminDashboard';
import TeacherDashboard from './components/pages/TeacherDashboard';
import ParentDashboard from './components/pages/ParentDashboard';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PasswordResetForm from './components/Auth/PasswordResetForm';
import { getUser, getToken } from './components/utils/auth';

// ProtectedRoute wrapper
const ProtectedRoute = ({ children, roles }) => {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // If user must change password, force redirect to reset-password
  if (user.mustChangePassword) {
    return <Navigate to="/reset-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

// Temporary placeholders
const LandingPagePlaceholder = () => (
  <div className="container mt-5 text-center">
    <h1>Welcome to Scoolynk!</h1>
    <p>Please log in or register to continue.</p>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPagePlaceholder />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route path="/reset-password" element={<PasswordResetForm />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
