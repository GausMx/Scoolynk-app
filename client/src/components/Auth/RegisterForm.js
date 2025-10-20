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
    classes: [], // Changed to array for multiple selection
    courses: [], // Changed to array for multiple selection
  });
  const [message, setMessage] = useState('');
  const [adminExists, setAdminExists] = useState(false);
  
  // NEW: State for dropdowns
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Check if admin exists
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
        .then(data => setAdminExists(!!data.exists))
        .catch(() => setAdminExists(false));
    }, 500);
    return () => clearTimeout(checkAdmin);
  }, [formData.schoolName, formData.role]);

  // NEW: Fetch classes and courses when teacher enters school code
  useEffect(() => {
    if (formData.role === 'teacher' && formData.schoolCode.length === 16) {
      fetchClassesAndCourses();
    } else {
      setAvailableClasses([]);
      setAvailableCourses([]);
    }
  }, [formData.schoolCode, formData.role]);

  const fetchClassesAndCourses = async () => {
    try {
      setLoadingOptions(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/teacher/classes-courses?schoolCode=${formData.schoolCode}`
      );
      setAvailableClasses(res.data.classes || []);
      setAvailableCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to fetch classes/courses:', err);
      setMessage('Invalid school code or failed to load classes/courses.');
      setAvailableClasses([]);
      setAvailableCourses([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NEW: Handle multi-select for classes and courses
  const handleMultiSelect = (e, fieldName) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, [fieldName]: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { ...formData };
      
      // Send classes and courses as arrays of IDs
      if (formData.role === 'teacher') {
        payload.classes = formData.classes; // Array of Class IDs
        payload.courses = formData.courses; // Array of Course names
      }

      const response = await API.post('/api/auth/register', payload);
      
      // Check if teacher needs onboarding
      if (response.data.needsOnboarding) {
        // Store teacher ID and token for onboarding
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('teacherId', response.data._id);
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
                {formData.role === 'teacher' && (
                  <>
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
                      {loadingOptions && <small className="text-muted">Loading classes and courses...</small>}
                    </div>
                    
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