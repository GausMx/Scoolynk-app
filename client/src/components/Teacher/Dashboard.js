import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await API.get('/api/teacher/classes');
        setClasses(res.data.classes || []);
      } catch (err) {
        setError('Failed to load classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Teacher Dashboard</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <div>
          <h4>Your Classes</h4>
          {classes.length === 0 ? (
            <div>No classes assigned.</div>
          ) : (
            <ul>
              {classes.map(cls => (
                <li key={cls._id}>{cls.name}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
