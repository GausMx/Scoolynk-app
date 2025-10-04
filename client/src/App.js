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

  if (user.mustChangePassword) {
    return <Navigate to="/reset-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/reset-password" element={<PasswordResetForm />} />

        {/* Admin routes with nested pages */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
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
          path="/parent/*"
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
