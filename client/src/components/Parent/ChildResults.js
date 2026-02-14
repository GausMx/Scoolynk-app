// src/components/Parent/ChildResults.js - NEW FILE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import Loading from '../common/Loading';
import { getUser } from '../utils/auth';

const { REACT_APP_API_URL } = process.env;

const ChildResults = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const token = localStorage.getItem('accessToken');

  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [termFilter, setTermFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

  useEffect(() => {
    fetchChildResults();
  }, [studentId]);

  useEffect(() => {
    applyFilters();
  }, [termFilter, sessionFilter, results]);

  const fetchChildResults = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(
        `${REACT_APP_API_URL}/api/parent/children/${studentId}/results`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLoadingPercent(70);
      setStudent(res.data.student);
      setResults(res.data.results);
      setFilteredResults(res.data.results);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (termFilter) {
      filtered = filtered.filter(r => r.term === termFilter);
    }

    if (sessionFilter) {
      filtered = filtered.filter(r => r.session === sessionFilter);
    }

    setFilteredResults(filtered);
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <Layout user={user} role="parent">
      <div className="container-fluid py-4 px-4" style={{ paddingTop: '140px', maxWidth: '1400px' }}>
        {/* Student Info Header */}
        <div className="card shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                style={{ width: '60px', height: '60px' }}
              >
                <i className="bi bi-person-fill text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <div>
                <h4 className="fw-bold mb-1">{student?.name}</h4>
                <p className="text-muted mb-0">
                  {student?.regNo} • {student?.classId?.name}
                </p>
              </div>
            </div>
            
            <button 
              className="btn btn-outline-primary rounded-3"
              onClick={() => navigate('/parent')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm rounded-4 p-3 mb-4">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Filter by Term</label>
              <select 
                className="form-select"
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
              >
                <option value="">All Terms</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
            
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Filter by Session</label>
              <input 
                type="text"
                className="form-control"
                placeholder="e.g., 2024/2025"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
              />
            </div>
            
            <div className="col-12 col-md-4 d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setTermFilter('');
                  setSessionFilter('');
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {filteredResults.length === 0 ? (
          <div className="alert alert-info rounded-3">
            <i className="bi bi-info-circle me-2"></i>
            No results found for the selected filters.
          </div>
        ) : (
          <div className="row g-4">
            {filteredResults.map(result => (
              <div key={result._id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-bold mb-1">{result.term}</h6>
                        <small className="text-muted">{result.session}</small>
                      </div>
                      <span className={`badge bg-${
                        result.overallGrade === 'A' ? 'success' :
                        result.overallGrade === 'B' ? 'primary' :
                        result.overallGrade === 'C' ? 'info' :
                        result.overallGrade === 'D' ? 'warning' : 'danger'
                      }`}>
                        Grade {result.overallGrade}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded-3">
                          <small className="text-muted d-block">Average</small>
                          <h5 className="fw-bold mb-0">{result.overallAverage}%</h5>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded-3">
                          <small className="text-muted d-block">Position</small>
                          <h5 className="fw-bold mb-0">
                            {result.overallPosition ? `${result.overallPosition}${
                              result.overallPosition === 1 ? 'st' :
                              result.overallPosition === 2 ? 'nd' :
                              result.overallPosition === 3 ? 'rd' : 'th'
                            }` : 'N/A'}
                          </h5>
                        </div>
                      </div>
                    </div>

                    {/* Subjects Count */}
                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="bi bi-book me-1"></i>
                        {result.subjects?.length || 0} subjects
                      </small>
                    </div>

                    {/* View Button */}
                    <button 
                      className="btn btn-primary w-100 rounded-3"
                      onClick={() => navigate(`/parent/results/${result._id}`)}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Full Result
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildResults;