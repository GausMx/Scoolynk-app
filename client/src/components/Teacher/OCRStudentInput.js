// src/components/Teacher/OCRStudentInput.js - FIXED WITH PREPROCESSING

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const OCRStudentInput = ({ classId, method, onComplete, onCancel }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const token = localStorage.getItem('accessToken');

  // Initialize Tesseract worker once
  useEffect(() => {
    const initWorker = async () => {
      try {
        workerRef.current = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        });
        console.log('[OCR] Worker initialized');
      } catch (error) {
        console.error('[OCR] Worker initialization failed:', error);
        setMessage({ type: 'error', text: 'Failed to initialize OCR engine' });
      }
    };

    initWorker();

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      stopCamera();
    };
  }, []);

  // Camera Methods
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setMessage({ type: 'info', text: 'Camera ready. Position document and capture.' });
      }
    } catch (error) {
      console.error('[Camera] Access error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to access camera. Please check permissions.' 
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setMessage({ type: 'error', text: 'Camera not ready' });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get preprocessed image
    const preprocessedCanvas = preprocessImage(canvas);
    
    // Convert to blob
    preprocessedCanvas.toBlob(async (blob) => {
      if (blob) {
        await processImage(blob);
        stopCamera(); // Stop camera after capture
      }
    }, 'image/png', 0.95);
  };

  // Image Preprocessing
  const preprocessImage = (sourceCanvas) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    
    // Draw original image
    ctx.drawImage(sourceCanvas, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Increase contrast (simple thresholding)
      const threshold = 128;
      const value = gray > threshold ? 255 : 0;
      
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      // Alpha channel (i + 3) stays the same
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image too large. Max 10MB allowed.' });
        return;
      }
      
      processImage(file);
    }
  };

  const processImage = async (imageFile) => {
    if (!workerRef.current) {
      setMessage({ type: 'error', text: 'OCR engine not ready. Please wait and try again.' });
      return;
    }

    setLoading(true);
    setOcrProgress(0);
    setMessage({ type: 'info', text: 'Processing image with OCR...' });

    try {
      // If it's a File object, preprocess it first
      let processedImage = imageFile;
      
      if (imageFile instanceof File) {
        const img = await createImageBitmap(imageFile);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const preprocessedCanvas = preprocessImage(canvas);
        processedImage = await new Promise(resolve => {
          preprocessedCanvas.toBlob(resolve, 'image/png', 0.95);
        });
      }

      // Perform OCR with optimized settings
      const result = await workerRef.current.recognize(processedImage, {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-@.',
      });

      const text = result.data.text;
      setRawText(text);
      console.log('[OCR] Extracted text:', text);

      const extractedStudents = parseStudentData(text);

      if (extractedStudents.length === 0) {
        setMessage({ 
          type: 'warning', 
          text: 'No student data detected. Please check image quality or enter manually.' 
        });
        setShowRawText(true);
      } else {
        setStudents(extractedStudents);
        setMessage({ 
          type: 'success', 
          text: `Found ${extractedStudents.length} student(s). Review and edit if needed.` 
        });
      }
    } catch (error) {
      console.error('[OCR] Processing error:', error);
      setMessage({ 
        type: 'error', 
        text: 'OCR processing failed: ' + (error.message || 'Unknown error') 
      });
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  };

  const parseStudentData = (text) => {
    const students = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    console.log('[OCR] Parsing lines:', lines);

    // Patterns
    const namePattern = /^[A-Za-z][A-Za-z\s]{2,50}$/;
    const regNoPattern = /[A-Z]{2,4}[\/-]?\d{2,}/i;
    const phonePattern = /(?:^|\s)(\+?\d{10,15})(?:\s|$)/;
    const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;

    let i = 0;
    while (i < lines.length) {
      const student = {};
      
      // Look ahead up to 6 lines
      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        const line = lines[j];
        
        // Skip very short lines
        if (line.length < 2) continue;

        // Extract name (alphabetic with 2+ words, no numbers)
        if (!student.name && namePattern.test(line) && !/\d/.test(line)) {
          const words = line.split(/\s+/);
          if (words.length >= 2) {
            student.name = words.map(w => 
              w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            ).join(' ');
          }
        }

        // Extract reg number
        if (!student.regNo) {
          const match = line.match(regNoPattern);
          if (match) {
            student.regNo = match[0].toUpperCase().replace(/\s+/g, '');
          }
        }

        // Extract phone
        if (!student.parentPhone) {
          const match = line.match(phonePattern);
          if (match) {
            let phone = match[1].replace(/\D/g, '');
            if (phone.startsWith('0') && phone.length === 11) {
              phone = '+234' + phone.substring(1);
            } else if (phone.startsWith('234')) {
              phone = '+' + phone;
            }
            student.parentPhone = phone;
          }
        }

        // Extract email
        if (!student.parentEmail) {
          const match = line.match(emailPattern);
          if (match) {
            student.parentEmail = match[0].toLowerCase();
          }
        }
      }

      // Add student if we have at least a name
      if (student.name) {
        if (!student.regNo) {
          student.regNo = `STD/${new Date().getFullYear().toString().slice(-2)}/${String(students.length + 1).padStart(3, '0')}`;
        }
        students.push(student);
        i += 4; // Skip ahead
      } else {
        i++;
      }
    }

    return students;
  };

  const handleStudentChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  const addStudent = () => {
    setStudents([...students, { 
      name: '', 
      regNo: `STD/${new Date().getFullYear().toString().slice(-2)}/${String(students.length + 1).padStart(3, '0')}`,
      parentPhone: '',
      parentEmail: ''
    }]);
  };

  const removeStudent = (index) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate
    const validStudents = students.filter(s => s.name && s.name.trim());
    
    if (validStudents.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one student with a name' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/students/bulk`,
        { students: validStudents, classId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: response.data.message });
      setTimeout(() => onComplete(), 1500);
    } catch (error) {
      console.error('[Submit] Error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add students' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-student-input">
      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'success' ? 'success' : message.type === 'warning' ? 'warning' : 'info'} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Camera Method */}
      {method === 'ocr' && (
        <div className="mb-4">
          <div className="d-flex gap-2 mb-3">
            <button 
              className="btn btn-primary"
              onClick={startCamera}
              disabled={streamRef.current !== null || loading}
            >
              <Camera size={18} className="me-2" />
              Start Camera
            </button>
            <button 
              className="btn btn-success"
              onClick={captureImage}
              disabled={!streamRef.current || loading}
            >
              <CheckCircle size={18} className="me-2" />
              Capture & Process
            </button>
            <button 
              className="btn btn-secondary"
              onClick={stopCamera}
              disabled={!streamRef.current}
            >
              <XCircle size={18} className="me-2" />
              Stop Camera
            </button>
          </div>

          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 border rounded mb-3"
            style={{ 
              maxHeight: '400px',
              display: streamRef.current ? 'block' : 'none',
              backgroundColor: '#000'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="text-center my-3">
            <strong>— OR —</strong>
          </div>

          <div>
            <label className="btn btn-outline-primary w-100">
              <Upload size={18} className="me-2" />
              Upload Image
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Progress Bar */}
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

      {/* Show Raw Text (Debug) */}
      {showRawText && rawText && (
        <div className="mb-3">
          <button 
            className="btn btn-sm btn-link" 
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? 'Hide' : 'Show'} Raw OCR Text
          </button>
          {showRawText && (
            <pre className="border p-3 bg-light" style={{ fontSize: '0.85em', maxHeight: '200px', overflow: 'auto' }}>
              {rawText}
            </pre>
          )}
        </div>
      )}

      {/* Students Table */}
      {students.length > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Students ({students.length})</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={addStudent}>
              <Edit2 size={16} className="me-1" />
              Add Row
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '30%' }}>Name *</th>
                  <th style={{ width: '20%' }}>Reg No</th>
                  <th style={{ width: '20%' }}>Phone</th>
                  <th style={{ width: '20%' }}>Email</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={student.name || ''}
                        onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={student.regNo || ''}
                        onChange={(e) => handleStudentChange(index, 'regNo', e.target.value)}
                        placeholder="Auto"
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        value={student.parentPhone || ''}
                        onChange={(e) => handleStudentChange(index, 'parentPhone', e.target.value)}
                        placeholder="Optional"
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={student.parentEmail || ''}
                        onChange={(e) => handleStudentChange(index, 'parentEmail', e.target.value)}
                        placeholder="Optional"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeStudent(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Entry for 'manual' method */}
      {method === 'manual' && students.length === 0 && (
        <div className="text-center py-4">
          <button className="btn btn-primary" onClick={addStudent}>
            Add First Student
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="d-flex justify-content-between mt-4">
        <button 
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={loading || students.length === 0}
        >
          {loading ? (
            <>
              <Loader size={18} className="me-2 spinner-border spinner-border-sm" />
              Submitting...
            </>
          ) : (
            `Submit ${students.length} Student(s)`
          )}
        </button>
      </div>
    </div>
  );
};

export default OCRStudentInput;