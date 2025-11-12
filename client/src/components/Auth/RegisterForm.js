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
        localStorage.setItem('user', JSON.stringify(response.data)); // Store full user data
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

  // Existing admin exists block with enhanced UI
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

  // Entire existing form with enhanced UI
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
              {/* Existing message display with dismissible alert */}
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
              
              {/* Entire existing form with input groups and icons */}
              <form onSubmit={handleSubmit}>
                {/* Role Select with Icon */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-person-badge me-2"></i>
                    Role
                  </label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-people"></i></span>
                    <select
                      className="form-select"
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
                </div>

                {/* Existing Conditional Rendering for School Name, School Code, Classes, Courses */}
                {formData.role === 'admin' && (
                  <div className="mb-3">
                    <label className="form-label d-flex align-items-center">
                      <i className="bi bi-building me-2"></i>
                      School Name
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-bank"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        placeholder="Enter school name"
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <>
                    {/* School Code Input */}
                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        <i className="bi bi-code-slash me-2"></i>
                        School Code
                      </label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-pin"></i></span>
                        <input
                          type="text"
                          className="form-control"
                          name="schoolCode"
                          value={formData.schoolCode}
                          onChange={handleChange}
                          placeholder="16-digit school code"
                          required
                          minLength={16}
                          maxLength={16}
                        />
                      </div>
                      {loadingOptions && <small className="text-muted">Loading classes and courses...</small>}
                    </div>

                    {/* Existing Multi-Select for Classes and Courses */}
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

                {/* Remaining existing fields with enhanced input groups */}
                {/* Name, Email, Phone, Password inputs */}
                {/* (Add similar input group styles as shown above) */}

                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg rounded-pill shadow-sm"
                  >
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Create Account
                  </button>
                </div>
              </form>

              <div className="text-center mt-3">
                <span className="me-2">Already have an account?</span>
                <Link to="/login" className="fw-bold text-primary text-decoration-none">
                  Login Here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;