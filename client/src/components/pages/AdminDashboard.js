// src/components/pages/AdminDashboard.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../common/Layout';

// Admin subpages
import Dashboard from '../Admin/Dashboard'; // this is your Home
import ReviewResults from '../Admin/ReviewResults';
import Broadcast from '../Admin/Broadcast';
import Settings from '../Admin/Settings';
import ManageParents from '../Admin/ManageParents';
import ManageTeachers from '../Admin/ManageTeachers';
import ManageStudents from '../Admin/ManageStudents';
import ManageClasses from '../Admin/ManageClasses';
import ManageCourses from '../Admin/ManageCourses';
const AdminDashboard = ({ user }) => {
  return (
    <Layout user={user} role="admin">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review-results" element={<ReviewResults />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/manage-parents" element={<ManageParents />} />
        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/manage-classes" element={<ManageClasses />} />
        <Route path="/manage-courses" element={<ManageCourses />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;
