// src/components/Auth/LoginForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { setToken, setUser} from '../utils/auth';
import { redirectByRole } from '../utils/auth';
import { Link } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { email, password } = formData;

  // handle input change
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // handle form submit
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/auth/login', { email, password });
      // backend should return token + user details
      const { token, role, name, _id, schoolId, mustChangePassword } = res.data;
      // store token and user info in localStorage, include mustChangePassword
      setToken(token);
      setUser({ id: _id, name, email, role, schoolId, mustChangePassword });
      // If mustChangePassword, redirect to password reset page
      if (mustChangePassword) {
        navigate('/reset-password');
      } else {
        // redirect by role
        navigate(redirectByRole(role));
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'Login failed. Try again.');
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
                Login
              </h2>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError('')}></button>
                </div>
              )}
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-envelope me-2"></i>
                    Email
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
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-lock me-2"></i>
                    Password
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
                    <Link to="/forgot-password" className="text-decoration-none small">Forgot Password?</Link>
                  </div>
                </div>
                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg rounded-pill"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
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