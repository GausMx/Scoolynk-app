// src/components/pages/AdminDashboard.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../common/Layout';

// Admin subpages
import Dashboard from '../Admin/Dashboard'; // this is your Home
import Settings from '../Admin/Settings';
import ManageTeachers from '../Admin/ManageTeachers';
import ManageStudents from '../Admin/ManageStudents';
import ManageClasses from '../Admin/ManageClasses';
import ManageCourses from '../Admin/ManageCourses';
import PaymentSetup from '../Admin/PaymentSetup';
import PaymentHistory from '../Admin/PaymentHistory';
import AdminResultManagement from '../Admin/AdminResultManagement'; 
import TemplateBuilder from '../Admin/TemplateBuilder';
const AdminDashboard = ({ user }) => {
  return (
    <Layout user={user} role="admin">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/manage-classes" element={<ManageClasses />} />
        <Route path="/manage-courses" element={<ManageCourses />} />
        <Route path="/payment-setup" element={<PaymentSetup/>} />
        <Route path="/payment-history" element={<PaymentHistory/>} />
        <Route path="/result-management" element={<AdminResultManagement />} />
        <Route path="/template-builder" element={<TemplateBuilder />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;
