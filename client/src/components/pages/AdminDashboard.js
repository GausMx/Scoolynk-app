// src/components/pages/AdminDashboard.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../common/Layout';

// Admin subpages
import Dashboard from '../Admin/Dashboard'; // this is your Home
import ReviewResults from '../Admin/ReviewResults';
import Broadcast from '../Admin/Broadcast';
import Settings from '../Admin/Settings';

const AdminDashboard = ({ user }) => {
  return (
    <Layout user={user} role="admin">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review-results" element={<ReviewResults />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;
