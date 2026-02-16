// src/components/Auth/LoginForm.js - CRITICAL FIX

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { setAccessToken, setUser, setRefreshToken } from '../utils/auth';
import { redirectByRole } from '../utils/auth';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true // ✅ Default to true
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { email, password, rememberMe } = formData;

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await API.post('/api/auth/login', { 
        email, 
        password,
        rememberMe 
      });
      
      const { accessToken, refreshToken, role, name, _id, schoolId, mustChangePassword } = res.data;

      // ✅ CRITICAL: Store rememberMe FIRST, before anything else
      localStorage.setItem('rememberMe', String(rememberMe));
      
      // Then save tokens and user info
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser({ id: _id, name, email, role, schoolId, mustChangePassword });

      // ✅ Verify it was stored
      const storedRememberMe = localStorage.getItem('rememberMe');
      console.log('[Login] Stored values:', {
        rememberMe: storedRememberMe,
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
        hasUser: !!localStorage.getItem('user')
      });

      // Redirect
      if (mustChangePassword) {
        navigate('/reset-password');
      } else {
        navigate(redirectByRole(role));
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Login failed. Try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Login to Scoolynk
              </h2>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
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
              <form onSubmit={onSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-envelope me-2"></i>Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-at"></i></span>
                    <input
                      type="email"
                      name="email"
                      className="form-control form-control-lg"
                      value={email}
                      onChange={onChange}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-lock me-2"></i>Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-key"></i></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control form-control-lg"
                      value={password}
                      onChange={onChange}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* ✅ Remember Me Checkbox */}
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="rememberMe"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={onChange}
                      disabled={isLoading}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      <i className="bi bi-shield-check me-1"></i>
                      Keep me logged in for 30 days
                    </label>
                  </div>
                  <small className="text-muted">
                    You won't need to log in again on this device for a month
                  </small>
                </div>

                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg rounded-pill"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3 bg-light">
              <span className="me-2">Don't have an account?</span>
              <Link to="/register" className="fw-bold text-primary text-decoration-none">
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;