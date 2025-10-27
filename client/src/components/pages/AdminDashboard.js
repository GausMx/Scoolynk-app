// src/components/pages/AdminDashboard.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../common/Layout';

// Admin subpages
import Dashboard from '../Admin/Dashboard'; // this is your Home
import ReviewResults from '../Admin/ReviewResults';
import Settings from '../Admin/Settings';
import ManageTeachers from '../Admin/ManageTeachers';
import ManageStudents from '../Admin/ManageStudents';
import ManageClasses from '../Admin/ManageClasses';
import ManageCourses from '../Admin/ManageCourses';
import PaymentSetup from '../Admin/PaymentSetup';
import PaymentHistory from '../Admin/PaymentHistory';
const AdminDashboard = ({ user }) => {
  return (
    <Layout user={user} role="admin">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review-results" element={<ReviewResults />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/manage-classes" element={<ManageClasses />} />
        <Route path="/manage-courses" element={<ManageCourses />} />
        <Route path="/payment-setup" element={<PaymentSetup/>} />
        <Route path="/payment-history" element={<PaymentHistory/>} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;
