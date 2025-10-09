// src/components/Auth/RegisterForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { setToken } from '../utils/auth';
import { Link } from 'react-router-dom';


const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    schoolName: '', // Only for admin
    schoolCode: '', // Only for teacher/parent
    role: '',
    children: '', // For parent (optional, comma-separated)
    classes: '', // For teacher (optional, comma-separated)
    courses: '', // For teacher (optional, comma-separated)
  });
  const [message, setMessage] = useState('');
  const [adminExists, setAdminExists] = useState(false);

  // Check if an admin already exists for the entered school name (only for admin role)
  useEffect(() => {
    if (formData.role !== 'admin' || !formData.schoolName) {
      setAdminExists(false);
      return;
    }
    const checkAdmin = setTimeout(() => {
      fetch(
        process.env.REACT_APP_API_URL + '/api/auth/admin-exists?schoolName=' + encodeURIComponent(formData.schoolName)
      )
        .then(res => res.json())
        .then(data => {
          setAdminExists(!!data.exists);
        })
        .catch(() => setAdminExists(false));
    }, 500);
    return () => clearTimeout(checkAdmin);
  }, [formData.schoolName, formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // Prepare payload
      const payload = { ...formData };
      if (formData.role === 'teacher') {
        payload.classes = formData.classes ? formData.classes.split(',').map(s => s.trim()) : [];
        payload.courses = formData.courses ? formData.courses.split(',').map(s => s.trim()) : [];
      }
      if (formData.role === 'parent') {
        payload.children = formData.children ? formData.children.split(',').map(s => s.trim()) : [];
      }
      await API.post('https://scoolynk-app.onrender.com/api/auth/register', payload);
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        schoolName: '',
        schoolCode: '',
        role: '',
        children: '',
        classes: '',
        courses: '',
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong.');
    }
  };

  // If admin exists for this school, block registration and show message
  if (formData.role === 'admin' && adminExists) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm rounded-3">
              <div className="card-body p-4 text-center">
                <h2 className="mb-4">Registration Blocked</h2>
                <div className="alert alert-danger rounded-3" role="alert">
                  An admin already exists for this school. Please <Link to="/login">login</Link> or contact your school admin.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
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
                  <label className="form-label">Role</label>
                  <select
                    className="form-select rounded-3"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
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
                {formData.role === 'admin' && (
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
                )}
                {(formData.role === 'teacher' || formData.role === 'parent') && (
                  <div className="mb-3">
                    <label className="form-label">School Code</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="schoolCode"
                      value={formData.schoolCode}
                      onChange={handleChange}
                      required
                      minLength={16}
                      maxLength={16}
                      placeholder="Enter 16-digit school code"
                    />
                  </div>
                )}
                {formData.role === 'teacher' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Classes (comma separated)</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="classes"
                        value={formData.classes}
                        onChange={handleChange}
                        placeholder="e.g. JSS1A, JSS2B"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Courses (comma separated)</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="courses"
                        value={formData.courses}
                        onChange={handleChange}
                        placeholder="e.g. Math, English"
                      />
                    </div>
                  </>
                )}
                {formData.role === 'parent' && (
                  <div className="mb-3">
                    <label className="form-label">Children (comma separated names)</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="children"
                      value={formData.children}
                      onChange={handleChange}
                      placeholder="e.g. John Doe, Jane Doe"
                    />
                  </div>
                )}
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary rounded-3 shadow-sm">
                    Register
                  </button>
                </div>
              </form>
              <div className="text-center mt-3">
                <span>Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
