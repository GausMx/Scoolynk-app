// src/components/Auth/RegisterForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { setToken } from '../utils/auth';


const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    schoolName: '',
    role: 'admin',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
    // The API instance automatically attaches the base URL
    await API.post('/api/auth/register', formData);
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      // Reset the form after successful registration
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        schoolName: '',
        role: 'admin',
      });
    } catch (error) {
      // Display the error message from the backend
      setMessage(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm rounded-3">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Register</h2>
              {message && (
                <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-danger'} rounded-3`} role="alert">
                  {message}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control rounded-3"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">School Name</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* Only admin registration allowed */}
                <input type="hidden" name="role" value="admin" />
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary rounded-3 shadow-sm">
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
