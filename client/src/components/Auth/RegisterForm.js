// src/components/Auth/RegisterForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import axios from 'axios';
import { setAccessToken, setUser } from '../utils/auth';

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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        `${process.env.REACT_APP_API_URL}/api/auth/admin-exists?schoolName=${encodeURIComponent(
          formData.schoolName
        )}`
      )
        .then(res => res.json())
        .then(data => setAdminExists(!!data.exists))
        .catch(() => setAdminExists(false));
    }, 500);
    return () => clearTimeout(checkAdmin);
  }, [formData.schoolName, formData.role]);

  // Fetch classes and courses for teachers
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
    } catch {
      setMessage('Invalid school code or failed to load classes/courses.');
      setAvailableClasses([]);
      setAvailableCourses([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleMultiSelect = (e, fieldName) => {
    const selectedOptions = Array.from(e.target.selectedOptions, opt => opt.value);
    setFormData({ ...formData, [fieldName]: selectedOptions });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      const payload = { ...formData };
      if (formData.role === 'teacher') {
        payload.classes = formData.classes;
        payload.courses = formData.courses;
      }

      const response = await API.post('/api/auth/register', payload);

      if (response.data.needsOnboarding) {
        setAccessToken(response.data.accessToken);
        setUser(response.data);
        setMessage('Registration successful! Redirecting to onboarding...');
        setTimeout(() => navigate('/teacher/onboarding'), 1500);
      } else {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
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
      setIsLoading(false);
    }
  };

  if (formData.role === 'admin' && adminExists) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-header bg-danger text-white text-center py-4">
                <h2 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Registration Blocked
                </h2>
              </div>
              <div className="card-body text-center">
                <div className="alert alert-danger">
                  An admin already exists for this school. Please{' '}
                  <Link to="/login" className="fw-bold">
                    login
                  </Link>{' '}
                  or contact your school admin.
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
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="mb-0">
                <i className="bi bi-person-plus-fill me-2"></i>
                Register to Scoolynk
              </h2>
            </div>
            <div className="card-body p-4">
              {message && (
                <div
                  className={`alert ${
                    message.includes('successful') ? 'alert-success' : 'alert-danger'
                  } alert-dismissible fade show`}
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
                {/* Role */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-person-badge me-2"></i>Role
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-shield-check"></i>
                    </span>
                    <select
                      className="form-select form-select-lg"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    >
                      <option value="">Select role</option>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-person me-2"></i>Name
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-person-circle"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-envelope me-2"></i>Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-at"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-telephone me-2"></i>Phone
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-phone"></i>
                    </span>
                    <input
                      type="tel"
                      className="form-control form-control-lg"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
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
                    <span className="input-group-text">
                      <i className="bi bi-key"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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

                {/* Admin School Name */}
                {formData.role === 'admin' && (
                  <div className="mb-3">
                    <label className="form-label d-flex align-items-center">
                      <i className="bi bi-building me-2"></i>School Name
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-bank"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        placeholder="Enter your school name"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Teacher School Code */}
                {formData.role === 'teacher' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        <i className="bi bi-key-fill me-2"></i>School Code
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-hash"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="schoolCode"
                          value={formData.schoolCode}
                          onChange={handleChange}
                          placeholder="Enter 16-digit school code"
                          required
                          minLength={16}
                          maxLength={16}
                          disabled={isLoading}
                        />
                      </div>
                      {loadingOptions && (
                        <div className="form-text">
                          <i className="bi bi-hourglass-split me-1"></i>
                          Loading classes and courses...
                        </div>
                      )}
                    </div>

                    {/* Classes */}
                    {availableClasses.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label d-flex align-items-center">
                          <i className="bi bi-book me-2"></i>Select Classes You Teach
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-list-check"></i>
                          </span>
                          <select
                            multiple
                            className="form-select form-select-lg"
                            size="5"
                            value={formData.classes}
                            onChange={e => handleMultiSelect(e, 'classes')}
                            required
                            disabled={isLoading}
                          >
                            {availableClasses.map(cls => (
                              <option key={cls._id} value={cls._id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Hold Ctrl/Cmd for multiple selection. Selected: {formData.classes.length}{' '}
                          class(es)
                        </div>
                      </div>
                    )}

                    {/* Courses */}
                    {availableCourses.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label d-flex align-items-center">
                          <i className="bi bi-journal-text me-2"></i>Select Courses You Teach
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-list-check"></i>
                          </span>
                          <select
                            multiple
                            className="form-select form-select-lg"
                            size="5"
                            value={formData.courses}
                            onChange={e => handleMultiSelect(e, 'courses')}
                            required
                            disabled={isLoading}
                          >
                            {availableCourses.map(course => (
                              <option key={course._id} value={course.name}>
                                {course.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Hold Ctrl/Cmd for multiple selection. Selected: {formData.courses.length}{' '}
                          course(s)
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg rounded-pill"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-check me-2"></i>
                        Register
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3 bg-light">
              <span className="me-2">Already have an account?</span>
              <Link to="/login" className="fw-bold text-primary text-decoration-none">
                Login Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;