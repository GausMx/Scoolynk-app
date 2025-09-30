import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await API.get('/api/parent/children');
        setChildren(res.data.children || []);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setError('Failed to load dashboard for parent.');
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Parent Dashboard</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <>
          <h4>Your Children</h4>
          {children.length === 0 ? (
            <div>No children found.</div>
          ) : (
            <ul>
              {children.map(child => (
                <li key={child._id}>
                  {child.name} ({child.classId?.name || 'No class'})
                  {/* Optionally display results, fees, notifications */}
                </li>
              ))}
            </ul>
          )}
          <h4 className="mt-4">Notifications</h4>
          {notifications.length === 0 ? (
            <div>No notifications.</div>
          ) : (
            <ul>
              {notifications.map((n, i) => (
                <li key={i}>{n.message}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
