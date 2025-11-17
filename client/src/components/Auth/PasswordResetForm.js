// src/components/Auth/PasswordResetForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { setAccessToken, setUser, getUser } from '../utils/auth';

const PasswordResetForm = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!user || !user.mustChangePassword) {
    // If not required, redirect to dashboard
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      // Call backend to update password
      const res = await API.post('/api/auth/reset-password', {
        userId: user.id,
        password,
      });
      // Update accessToken and user in localStorage, clear mustChangePassword
      setAccessToken(res.data.accessToken);
      setUser({ ...user, mustChangePassword: false });
      setSuccess('Password updated! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-warning text-white text-center py-4">
              <h2 className="mb-0">
                <i className="bi bi-shield-lock me-2"></i>
                Reset Password
              </h2>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                    onClick={() => setError('')}
                  ></button>
                </div>
              )}
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                    onClick={() => setSuccess('')}
                  ></button>
                </div>
              )}

              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle-fill me-2"></i>
                <strong>Action Required:</strong> You must change your password before continuing.
              </div>

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-lock me-2"></i>New Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-key"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  <div className="form-text">
                    <i className="bi bi-info-circle me-1"></i>
                    Password must be at least 6 characters long
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-lock-fill me-2"></i>Confirm Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-key-fill"></i>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-warning btn-lg rounded-pill">
                    <i className="bi bi-check-circle me-2"></i>
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3 bg-light">
              <small className="text-muted">
                <i className="bi bi-shield-check me-1"></i>
                Your password will be securely encrypted
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetForm;