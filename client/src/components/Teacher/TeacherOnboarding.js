// src/components/Teacher/TeacherOnboarding.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentInput from './StudentInput';

const { REACT_APP_API_URL } = process.env;

const TeacherOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isClassTeacher, setIsClassTeacher] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [inputMethod, setInputMethod] = useState(null); // 'manual' or 'camera'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const teacherId = localStorage.getItem('teacherId');

  useEffect(() => {
    if (!token || !teacherId) {
      navigate('/login');
    }
  }, [token, teacherId, navigate]);

  // Fetch available classes for the dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/school-classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableClasses(res.data.classes || []);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
        setMessage('Failed to load classes. Please try again.');
      }
    };
    
    if (isClassTeacher === 'yes' && step === 2) {
      fetchClasses();
    }
  }, [isClassTeacher, step, token]);

  const handleClassTeacherAnswer = (answer) => {
    setIsClassTeacher(answer);
    if (answer === 'yes') {
      setStep(2); // Go to class selection
    } else {
      // Not a class teacher, redirect to login
      setMessage('Registration complete! Please login to access your dashboard.');
      setTimeout(() => {
        localStorage.removeItem('teacherId');
        navigate('/login');
      }, 2000);
    }
  };

  const handleClassSelection = (e) => {
    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
    setSelectedClasses(selected);
  };

  const handleSaveClassTeacherInfo = async () => {
    if (selectedClasses.length === 0) {
      setMessage('Please select at least one class.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${REACT_APP_API_URL}/api/teacher/onboarding/class-teacher`,
        { teacherId, classTeacherFor: selectedClasses },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Class teacher info saved!');
      setStep(3); // Go to input method selection
    } catch (err) {
      console.error('Failed to save class teacher info:', err);
      setMessage(err.response?.data?.message || 'Failed to save class teacher info.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputMethodSelection = (method) => {
    setInputMethod(method);
    setStep(4); // Go to student input
  };

  const handleStudentsAdded = () => {
    setMessage('Students added successfully! Redirecting to login...');
    setTimeout(() => {
      localStorage.removeItem('teacherId');
      navigate('/login');
    }, 2000);
  };

  const handleSkipStudentInput = () => {
    setMessage('Onboarding complete! Redirecting to login...');
    setTimeout(() => {
      localStorage.removeItem('teacherId');
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg rounded-4">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Teacher Onboarding</h2>
              
              {message && (
                <div className={`alert ${message.includes('Failed') || message.includes('Please') ? 'alert-warning' : 'alert-success'} rounded-3`}>
                  {message}
                </div>
              )}

              {/* Step 1: Are you a class teacher? */}
              {step === 1 && (
                <div className="text-center">
                  <h4 className="mb-4">Are you a class teacher?</h4>
                  <p className="text-muted mb-4">Class teachers manage a specific class and its students.</p>
                  <div className="d-flex justify-content-center gap-3">
                    <button 
                      className="btn btn-success btn-lg rounded-3 px-5"
                      onClick={() => handleClassTeacherAnswer('yes')}
                    >
                      Yes
                    </button>
                    <button 
                      className="btn btn-secondary btn-lg rounded-3 px-5"
                      onClick={() => handleClassTeacherAnswer('no')}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Select classes you're class teacher for */}
              {step === 2 && (
                <div>
                  <h4 className="mb-4">Select the class(es) you are a class teacher for:</h4>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Classes (Hold Ctrl/Cmd for multiple)</label>
                    <select
                      multiple
                      className="form-select rounded-3"
                      size="6"
                      value={selectedClasses}
                      onChange={handleClassSelection}
                    >
                      {availableClasses.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Selected: {selectedClasses.length} class(es)</small>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      className="btn btn-outline-secondary rounded-3"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button 
                      className="btn btn-primary rounded-3"
                      onClick={handleSaveClassTeacherInfo}
                      disabled={loading || selectedClasses.length === 0}
                    >
                      {loading ? 'Saving...' : 'Continue'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Choose input method */}
              {step === 3 && (
                <div className="text-center">
                  <h4 className="mb-4">How would you like to add your students?</h4>
                  <p className="text-muted mb-4">Choose a method to input student information.</p>
                  <div className="d-flex flex-column gap-3 align-items-center">
                    <button 
                      className="btn btn-primary btn-lg rounded-3 w-75"
                      onClick={() => handleInputMethodSelection('manual')}
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Register Manually
                    </button>
                    <button 
                      className="btn btn-info btn-lg rounded-3 w-75"
                      onClick={() => handleInputMethodSelection('camera')}
                    >
                      <i className="bi bi-camera me-2"></i>
                      Scan with Camera (OCR)
                    </button>
                    <button 
                      className="btn btn-outline-secondary rounded-3 mt-3"
                      onClick={handleSkipStudentInput}
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Student Input Component */}
              {step === 4 && (
                <StudentInput
                  inputMethod={inputMethod}
                  selectedClasses={selectedClasses}
                  onComplete={handleStudentsAdded}
                  onBack={() => setStep(3)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOnboarding;