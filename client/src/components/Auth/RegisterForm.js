// src/components/Auth/RegisterForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    schoolName: '',
    schoolCode: '',
    role: '',
    classes: [], 
    courses: [], 
  });
  const [message, setMessage] = useState('');
  const [adminExists, setAdminExists] = useState(false);
  
  // NEW: State for dropdowns
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Existing useEffect hooks (admin exists check and classes/courses fetch)
  // ... [Keep all existing useEffect hooks from the previous implementation]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Existing handleMultiSelect method
  const handleMultiSelect = (e, fieldName) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, [fieldName]: selectedOptions });
  };

  // Existing handleSubmit method
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { ...formData };
      
      if (formData.role === 'teacher') {
        payload.classes = formData.classes;
        payload.courses = formData.courses;
      }

      const response = await API.post('/api/auth/register', payload);
      
      if (response.data.needsOnboarding) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('teacherId', response.data._id);
        localStorage.setItem('user', JSON.stringify(response.data));
        setMessage('Registration successful! Redirecting to onboarding...');
        setTimeout(() => {
          navigate('/teacher/onboarding');
        }, 1500);
      } else {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        schoolName: '',
        schoolCode: '',
        role: '',
        classes: [],
        courses: [],
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong.');
    }
  };

  // Admin exists block
  if (formData.role === 'admin' && adminExists) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-danger text-white text-center py-4">
                <h2 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Registration Blocked
                </h2>
              </div>
              <div className="card-body p-4 text-center">
                <div className="alert alert-danger rounded-3" role="alert">
                  An admin already exists for this school. 
                  Please <Link to="/login" className="alert-link">login</Link> or contact your school admin.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="mb-0">
                <i className="bi bi-person-plus me-2"></i>
                Register
              </h2>
            </div>
            <div className="card-body p-4">
              {message && (
                <div 
                  className={`alert ${message.includes('successful') 
                    ? 'alert-success' 
                    : 'alert-danger'} alert-dismissible fade show rounded-3`} 
                  role="alert"
                >
                  {message}
                  <button 
                    type="button" 
                    className="btn-close" 
                    data-bs-dismiss="alert" 
                    aria-label="Close"
                    onClick={() => setMessage('')}
                  ></button>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* Role Select */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-person-badge me-2"></i>
                    Role
                  </label>
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
                  </select>
                </div>

                {/* Name Input */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-person me-2"></i>
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email Input */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-envelope me-2"></i>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone Input */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-phone me-2"></i>
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="form-control rounded-3"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-lock me-2"></i>
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control rounded-3"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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
                </div>

                {/* School Name for Admin */}
                {formData.role === 'admin' && (
                  <div className="mb-3">
                    <label className="form-label d-flex align-items-center">
                      <i className="bi bi-building me-2"></i>
                      School Name
                    </label>
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

                {/* School Code and Class/Course Selection for Teacher */}
                {formData.role === 'teacher' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        <i className="bi bi-code-slash me-2"></i>
                        School Code
                      </label>
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
                      {loadingOptions && <small className="text-muted">Loading classes and courses...</small>}
                    </div>
                    
                    {/* Existing Classes and Courses Multi-Select */}
                    {availableClasses.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label">Select Classes You Teach (Hold Ctrl/Cmd for multiple)</label>
                        <select
                          multiple
                          className="form-select rounded-3"
                          size="5"
                          value={formData.classes}
                          onChange={(e) => handleMultiSelect(e, 'classes')}
                          required
                        >
                          {availableClasses.map((cls) => (
                            <option key={cls._id} value={cls._id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">Selected: {formData.classes.length} class(es)</small>
                      </div>
                    )}
                    
                    {availableCourses.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label">Select Courses You Teach (Hold Ctrl/Cmd for multiple)</label>
                        <select
                          multiple
                          className="form-select rounded-3"
                          size="5"
                          value={formData.courses}
                          onChange={(e) => handleMultiSelect(e, 'courses')}
                          required
                        >
                          {availableCourses.map((course) => (
                            <option key={course._id} value={course.name}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">Selected: {formData.courses.length} course(s)</small>
                      </div>
                    )}
                  </>
                )}

                {/* Submit Button */}
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-3 shadow-sm"
                  >
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Register
                  </button>
                </div>
              </form>

              {/* Login Link */}
              <div className="text-center mt-3">
                <span>Already have an account? </span>
                <Link to="/login" className="text-primary">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;