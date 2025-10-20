// src/components/Teacher/StudentInput.js

import React, { useState, useRef } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';

const { REACT_APP_API_URL } = process.env;

const StudentInput = ({ inputMethod, selectedClasses, onComplete, onBack }) => {
  const [students, setStudents] = useState([{ name: '', regNo: '' }]);
  const [selectedClass, setSelectedClass] = useState(selectedClasses[0] || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const token = localStorage.getItem('token');

  // Manual Input Handlers
  const handleStudentChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  const addStudentRow = () => {
    setStudents([...students, { name: '', regNo: '' }]);
  };

  const removeStudentRow = (index) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    // Validate students
    const validStudents = students.filter(s => s.name.trim() !== '');
    if (validStudents.length === 0) {
      setMessage('Please add at least one student.');
      return;
    }

    if (!selectedClass) {
      setMessage('Please select a class.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${REACT_APP_API_URL}/api/teacher/students/bulk`,
        { students: validStudents, classId: selectedClass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`${validStudents.length} students added successfully!`);
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error('Failed to add students:', err);
      setMessage(err.response?.data?.message || 'Failed to add students.');
    } finally {
      setLoading(false);
    }
  };

  // Camera OCR Handlers
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setMessage('Failed to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        processImage(blob);
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (imageFile) => {
    setLoading(true);
    setMessage('Processing image with OCR...');
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setOcrProgress(Math.round(info.progress * 100));
          }
        }
      });

      const text = result.data.text;
      const extractedStudents = parseStudentData(text);
      
      if (extractedStudents.length === 0) {
        setMessage('No student data found in the image. Please try again or enter manually.');
      } else {
        setStudents(extractedStudents);
        setMessage(`Extracted ${extractedStudents.length} students from image. Review and submit.`);
      }
      
      stopCamera();
    } catch (err) {
      console.error('OCR Error:', err);
      setMessage('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  };

  // Parse OCR text to extract student names and reg numbers
  const parseStudentData = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const students = [];

    // Pattern matching: Look for lines with name and optional reg number
    // Example formats:
    // "John Doe REG001"
    // "Jane Smith - REG002"
    // "1. Mike Johnson REG003"
    
    lines.forEach(line => {
      // Remove numbering (1., 2., etc.)
      let cleaned = line.replace(/^\d+\.\s*/, '').trim();
      
      // Try to extract reg number (assuming it's alphanumeric and at the end)
      const regMatch = cleaned.match(/\b([A-Z0-9]{3,})\s*$/i);
      let name = cleaned;
      let regNo = '';
      
      if (regMatch) {
        regNo = regMatch[1];
        name = cleaned.replace(regMatch[0], '').trim();
      }
      
      // Clean up separators like - or :
      name = name.replace(/[-:]\s*$/, '').trim();
      
      if (name.length > 2) { // Only add if name is meaningful
        students.push({ name, regNo });
      }
    });

    return students;
  };

  return (
    <div>
      <h4 className="mb-4">
        {inputMethod === 'manual' ? 'Register Students Manually' : 'Scan Student List with Camera'}
      </h4>

      {message && (
        <div className={`alert ${message.includes('Failed') || message.includes('Please') ? 'alert-warning' : 'alert-success'} rounded-3`}>
          {message}
        </div>
      )}

      {/* Class Selection */}
      <div className="mb-4">
        <label className="form-label fw-semibold">Select Class</label>
        <select
          className="form-select rounded-3"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          required
        >
          <option value="">-- Select Class --</option>
          {selectedClasses.map((classId) => (
            <option key={classId} value={classId}>
              {classId} {/* You might want to fetch class names */}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Input */}
      {inputMethod === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <div className="table-responsive mb-3">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '50%' }}>Student Name *</th>
                  <th style={{ width: '35%' }}>Reg Number (Optional)</th>
                  <th style={{ width: '10%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={student.name}
                        onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                        placeholder="Enter student name"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={student.regNo}
                        onChange={(e) => handleStudentChange(index, 'regNo', e.target.value)}
                        placeholder="Optional"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeStudentRow(index)}
                        disabled={students.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            type="button" 
            className="btn btn-outline-primary rounded-3 mb-3"
            onClick={addStudentRow}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Another Student
          </button>

          <div className="d-flex justify-content-between mt-4">
            <button 
              type="button" 
              className="btn btn-outline-secondary rounded-3"
              onClick={onBack}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="btn btn-success rounded-3"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Students'}
            </button>
          </div>
        </form>
      )}

      {/* Camera/OCR Input */}
      {inputMethod === 'camera' && (
        <div>
          <div className="mb-4">
            <h5>Option 1: Use Camera</h5>
            <div className="d-flex gap-2 mb-3">
              <button 
                className="btn btn-primary rounded-3"
                onClick={startCamera}
                disabled={stream !== null}
              >
                <i className="bi bi-camera-video me-2"></i>
                Start Camera
              </button>
              <button 
                className="btn btn-success rounded-3"
                onClick={captureImage}
                disabled={!stream || loading}
              >
                <i className="bi bi-camera me-2"></i>
                Capture & Process
              </button>
              <button 
                className="btn btn-secondary rounded-3"
                onClick={stopCamera}
                disabled={!stream}
              >
                Stop Camera
              </button>
            </div>
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-100 border rounded-3"
              style={{ maxHeight: '400px', display: stream ? 'block' : 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="mb-4">
            <h5>Option 2: Upload Image</h5>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="form-control rounded-3"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>

          {loading && ocrProgress > 0 && (
            <div className="mb-3">
              <div className="progress">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{ width: `${ocrProgress}%` }}
                >
                  {ocrProgress}%
                </div>
              </div>
            </div>
          )}

          {/* Show extracted students for review */}
          {students.length > 0 && students[0].name !== '' && (
            <div className="mt-4">
              <h5>Extracted Students (Review & Edit if needed)</h5>
              <form onSubmit={handleManualSubmit}>
                <div className="table-responsive mb-3">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Reg Number</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={student.name}
                              onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={student.regNo}
                              onChange={(e) => handleStudentChange(index, 'regNo', e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeStudentRow(index)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-3"
                    onClick={onBack}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success rounded-3"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Students'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentInput;