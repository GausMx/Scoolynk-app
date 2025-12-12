import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// pages & auth
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import TeacherOnboarding from './components/Teacher/TeacherOnboarding';
import AdminDashboard from './components/pages/AdminDashboard';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PasswordResetForm from './components/Auth/PasswordResetForm';
import { getUser, getAccessToken } from './components/utils/auth';
import PublicPaymentPage from './components/public/PublicPaymentPage';
import PaymentVerification from './components/public/paymentVerification';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// ProtectedRoute wrapper
const ProtectedRoute = ({ children, roles }) => {
  const user = getUser();
  const token = getAccessToken(); // Updated to accessToken

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
        {/* ========== ✅ NEW PUBLIC PAYMENT ROUTES (NO AUTH REQUIRED) ========== */}
        
        {/* Public Payment Page - Parent clicks SMS link and lands here */}
        <Route path="/pay/:token" element={<PublicPaymentPage />} />
        
        {/* Payment Verification - Paystack redirects here after payment */}
        <Route path="/payment/verify" element={<PaymentVerification />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
