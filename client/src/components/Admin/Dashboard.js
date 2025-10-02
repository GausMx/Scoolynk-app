// src/components/Admin/Dashboard.js

import React, { useState, useEffect } from 'react';
import ReviewResults from './ReviewResults';
import Broadcast from './Broadcast';
const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Safely parse user from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user from localStorage", error);
      setUser(null);
    }
  }, []);

  return (
    <main className="container mt-5" role="main">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-sm rounded-3 p-4">
            <h1 className="mb-4">
              Welcome, <span className="text-primary">{user?.name || 'Admin'}</span>!
            </h1>
            <p className="lead">
              This is your administrator dashboard. Manage users, classes, results, and notifications here.
            </p>
            <hr className="my-4" />
            <ReviewResults />
            <Broadcast />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
