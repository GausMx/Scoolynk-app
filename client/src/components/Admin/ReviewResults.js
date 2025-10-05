// src/components/Admin/ReviewResults.js
import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/api';
import '../common/Layout.css';

const ReviewResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await API.get('/api/admin/results');
      // Ensure results is always an array
      setResults(res.data.results || []);
    } catch (err) {
      console.error('[FetchResults]', err);
      // Only set error if the request truly failed
      const backendMsg = err.response?.data?.message;
      setError(backendMsg || 'Failed to load results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleReview = async (resultId, action) => {
    setMessage('');
    try {
      await API.post('/api/admin/results/review', { resultId, action });
      setMessage(`Result ${action}ed.`);
      setResults(prev => prev.filter(r => r._id !== resultId));
    } catch (err) {
      console.error('[ReviewResult]', err);
      setMessage('Failed to update result.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card p-3 mb-4">
      <h5>Review Teacher-Submitted Results</h5>

      {/* Message */}
      {message && <div className="alert alert-info">{message}</div>}

      {/* Error */}
      {error && (
        <div className="alert alert-danger">
          {error}{' '}
          <button className="btn btn-link btn-sm ms-2" onClick={fetchResults}>
            Retry
          </button>
        </div>
      )}

      {/* No results */}
      {!error && results.length === 0 && (
        <div className="alert alert-info">No results uploaded yet.</div>
      )}

      {/* Results table */}
      {!error && results.length > 0 && (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Grade</th>
              <th>Teacher</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr key={result._id}>
                <td>{result.student?.name}</td>
                <td>{result.student?.classId?.name}</td>
                <td>{result.subject}</td>
                <td>{result.grade}</td>
                <td>{result.teacher?.name}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleReview(result._id, 'verify')}
                  >
                    Verify
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReview(result._id, 'reject')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReviewResults;
