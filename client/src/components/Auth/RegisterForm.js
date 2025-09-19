// src/components/Auth/RegisterForm.js

import React, { useState } from 'react';
import API from '../utils/api';
import { setToken } from '../utils/auth';


const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'parent',
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
      await API.post('/auth/register', formData);
      setMessage('Registration successful!');
      // Reset the form after successful registration
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'parent',
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
                <div className="mb-4">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select rounded-3"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
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
