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
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="text-center mb-4">Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
              <div className="text-center mt-3">
                <span>Don't have an account? </span>
                <Link to="/register">Register</Link>
              </div>
    </div>
  );
};

export default LoginForm;
