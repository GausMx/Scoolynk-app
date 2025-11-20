// src/components/Teacher/ResultEntryModal.js - WITH ENHANCED OCR

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, Send, Camera, Upload, Loader, AlertCircle, CheckCircle, Eye, Edit } from 'lucide-react';
import BrowserOCR from '../../utils/ocrHelper';

const { REACT_APP_API_URL } = process.env;

const ResultEntryModal = ({
  mode = 'manual',
  student = {},
  existingResult = null,
  term,
  session,
  onClose = () => {},
  onSuccess = () => {},
  token = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentMode, setCurrentMode] = useState(mode);

  const [subjects, setSubjects] = useState([]);
  const [affectiveTraits, setAffectiveTraits] = useState({
    punctuality: 3, behaviour: 3, neatness: 3,
    relationship: 3, attentiveness: 3, initiative: 3
  });
  const [fees, setFees] = useState({ tuition: 0, uniform: 0, books: 0, lesson: 0, other: 0 });
  const [attendance, setAttendance] = useState({ opened: 0, present: 0, absent: 0 });
  const [comments, setComments] = useState({ teacher: '', principal: '' });

  // OCR States
  const [scanImage, setScanImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [rawOCRText, setRawOCRText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(0);

  // Camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef(null);

  // Initialize subjects
  useEffect(() => {
    if (existingResult) {
      setSubjects(existingResult.subjects || []);
      setAffectiveTraits(existingResult.affectiveTraits || affectiveTraits);
      setFees(existingResult.fees || fees);
      setAttendance(existingResult.attendance || attendance);
      setComments(existingResult.comments || comments);
    } else {
      // Initialize with empty subjects
      setSubjects([
        { subject: 'Mathematics', ca1: 0, ca2: 0, exam: 0 },
        { subject: 'English Language', ca1: 0, ca2: 0, exam: 0 },
        { subject: 'Basic Science', ca1: 0, ca2: 0, exam: 0 },
        { subject: 'Social Studies', ca1: 0, ca2: 0, exam: 0 },
        { subject: 'Computer Science', ca1: 0, ca2: 0, exam: 0 }
      ]);
    }
  }, [existingResult]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Camera Functions
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
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      console.error('[Camera] Error:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setScanImage(reader.result);
          stopCamera();
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/png', 0.95);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Max 10MB allowed.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => setScanImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleScanScores = async () => {
    if (!scanImage) {
      setError('Please upload or capture an image first');
      return;
    }

    try {
      setScanning(true);
      setError('');
      setSuccess('');
      setScanProgress(0);
      setRawOCRText('');

      console.log('[OCR] Starting score extraction...');

      const result = await BrowserOCR.extractResultData(
        scanImage, 
        (progress) => setScanProgress(progress)
      );

      if (!result.success || !result.subjects || result.subjects.length === 0) {
        setError(result.error || 'No scores found in image. Please check image quality.');
        setRawOCRText(result.rawText || '');
        setShowRawText(true);
        return;
      }

      console.log('[OCR] Extracted', result.subjects.length, 'subjects');

      // Merge with existing subjects or replace
      const extractedSubjects = result.subjects;
      setSubjects(extractedSubjects);
      setRawOCRText(result.rawText);
      setOcrConfidence(result.confidence);
      
      setSuccess(`Successfully extracted ${extractedSubjects.length} subject(s)! Please review and correct if needed.`);
      setCurrentMode('manual'); // Switch to manual mode to review
      setScanImage(null); // Clear image

    } catch (err) {
      console.error('[OCR] Error:', err);
      setError('Failed to process image: ' + (err.message || err));
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = field === 'subject' ? value : Math.max(0, Number(value) || 0);
    setSubjects(updated);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subject: '', ca1: 0, ca2: 0, exam: 0 }]);
  };

  const removeSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const calculateTotal = (subject) => {
    return (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
  };

  const calculateGrade = (total) => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 40) return 'D';
    return 'F';
  };

  const handleSave = async (submitToAdmin = false) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const validSubjects = subjects.filter(s => s.subject && s.subject.trim());
      if (validSubjects.length === 0) {
        setError('Please add at least one subject with scores');
        setLoading(false);
        return;
      }

      const payload = {
        studentId: student._id,
        term,
        session,
        subjects: validSubjects,
        affectiveTraits,
        fees,
        attendance,
        comments,
        status: submitToAdmin ? 'submitted' : 'draft',
        wasScanned: ocrConfidence > 0,
        scanData: ocrConfidence > 0 ? {
          scannedAt: new Date(),
          rawText: rawOCRText,
          confidence: ocrConfidence
        } : undefined
      };

      if (existingResult) payload.resultId = existingResult._id;

      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/results`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.message || 'Result saved successfully!');
      setTimeout(() => onSuccess(res.data), 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          
          {/* Header */}
          <div className="modal-header">
            <div>
              <h5 className="modal-title">
                Result Entry - {student.name}
              </h5>
              <small className="text-muted">
                {term}, {session} | Reg: {student.regNo}
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Alerts */}
            {error && (
              <div className="alert alert-danger d-flex align-items-start">
                <AlertCircle size={20} className="me-2 mt-1" />
                <div>
                  {error}
                  {showRawText && rawOCRText && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-decoration-underline">
                        Show OCR Text
                      </summary>
                      <pre className="mt-2 p-2 bg-light rounded" style={{ fontSize: '0.85em', maxHeight: '200px', overflow: 'auto' }}>
                        {rawOCRText}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {success && (
              <div className="alert alert-success d-flex align-items-center">
                <CheckCircle size={20} className="me-2" />
                {success}
              </div>
            )}

            {/* Mode Selector */}
            <div className="btn-group mb-4 w-100" role="group">
              <button
                type="button"
                className={`btn ${currentMode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentMode('manual')}
              >
                <Edit size={18} className="me-2" />
                Manual Entry
              </button>
              <button
                type="button"
                className={`btn ${currentMode === 'scan' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentMode('scan')}
              >
                <Camera size={18} className="me-2" />
                Scan Result Sheet
              </button>
            </div>

            {/* Manual Entry Mode */}
            {currentMode === 'manual' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Subject Scores</h6>
                  <button className="btn btn-sm btn-outline-primary" onClick={addSubject}>
                    <Plus size={16} className="me-1" />
                    Add Subject
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '30%' }}>Subject</th>
                        <th style={{ width: '12%' }}>CA1 (20)</th>
                        <th style={{ width: '12%' }}>CA2 (20)</th>
                        <th style={{ width: '12%' }}>Exam (60)</th>
                        <th style={{ width: '12%' }}>Total</th>
                        <th style={{ width: '10%' }}>Grade</th>
                        <th style={{ width: '12%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, index) => {
                        const total = calculateTotal(subject);
                        const grade = calculateGrade(total);
                        return (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={subject.subject}
                                onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                                placeholder="Subject name"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm text-center"
                                value={subject.ca1}
                                onChange={(e) => handleSubjectChange(index, 'ca1', Math.min(20, e.target.value))}
                                min="0"
                                max="20"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm text-center"
                                value={subject.ca2}
                                onChange={(e) => handleSubjectChange(index, 'ca2', Math.min(20, e.target.value))}
                                min="0"
                                max="20"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm text-center"
                                value={subject.exam}
                                onChange={(e) => handleSubjectChange(index, 'exam', Math.min(60, e.target.value))}
                                min="0"
                                max="60"
                              />
                            </td>
                            <td className="text-center fw-bold">{total}</td>
                            <td className="text-center fw-bold">{grade}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeSubject(index)}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Attendance & Comments */}
                <div className="row mt-4">
                  <div className="col-md-12 mb-3">
                    <h6>Attendance</h6>
                    <div className="row g-2">
                      <div className="col-4">
                        <label className="form-label small">Days Opened</label>
                        <input
                          type="number"
                          className="form-control"
                          value={attendance.opened}
                          onChange={(e) => setAttendance({...attendance, opened: Math.max(0, Number(e.target.value))})}
                          min="0"
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small">Days Present</label>
                        <input
                          type="number"
                          className="form-control"
                          value={attendance.present}
                          onChange={(e) => setAttendance({...attendance, present: Math.max(0, Number(e.target.value))})}
                          min="0"
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small">Days Absent</label>
                        <input
                          type="number"
                          className="form-control"
                          value={attendance.absent}
                          onChange={(e) => setAttendance({...attendance, absent: Math.max(0, Number(e.target.value))})}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6>Comments</h6>
                    <div className="mb-3">
                      <label className="form-label">Teacher's Comment</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={comments.teacher}
                        onChange={(e) => setComments({...comments, teacher: e.target.value})}
                        placeholder="Enter your comment..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Mode */}
            {currentMode === 'scan' && (
              <div>
                <div className="card border-primary mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Scan Result Sheet</h6>
                    <p className="text-muted small">
                      Upload or capture an image of the filled result sheet. The system will extract subject names and scores.
                    </p>

                    <div className="d-flex gap-2 mb-3">
                      <button 
                        className="btn btn-primary"
                        onClick={startCamera}
                        disabled={cameraActive || scanning}
                      >
                        <Camera size={18} className="me-2" />
                        Start Camera
                      </button>
                      <button 
                        className="btn btn-success"
                        onClick={captureImage}
                        disabled={!cameraActive || scanning}
                      >
                        <CheckCircle size={18} className="me-2" />
                        Capture
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={stopCamera}
                        disabled={!cameraActive}
                      >
                        Stop Camera
                      </button>
                      <label className="btn btn-outline-primary">
                        <Upload size={18} className="me-2" />
                        Upload Image
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                          disabled={scanning}
                        />
                      </label>
                    </div>

                    {/* Camera Preview */}
                    {cameraActive && (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-100 border rounded mb-3"
                        style={{ maxHeight: '400px', backgroundColor: '#000' }}
                      />
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Image Preview */}
                    {scanImage && !cameraActive && (
                      <div className="mb-3">
                        <img 
                          src={scanImage} 
                          alt="Scanned result sheet" 
                          className="img-fluid border rounded"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    )}

                    {/* Scan Button */}
                    {scanImage && (
                      <button
                        className="btn btn-lg btn-success w-100"
                        onClick={handleScanScores}
                        disabled={scanning}
                      >
                        {scanning ? (
                          <>
                            <Loader size={20} className="me-2 spinner-border spinner-border-sm" />
                            Scanning... {scanProgress}%
                          </>
                        ) : (
                          <>
                            <Eye size={20} className="me-2" />
                            Extract Scores from Image
                          </>
                        )}
                      </button>
                    )}

                    {/* Progress Bar */}
                    {scanning && scanProgress > 0 && (
                      <div className="progress mt-3">
                        <div 
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          style={{ width: `${scanProgress}%` }}
                        >
                          {scanProgress}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="alert alert-info">
                  <strong>Tips for best results:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Ensure good lighting (no shadows)</li>
                    <li>Keep the paper flat and straight</li>
                    <li>Make sure all text is visible and legible</li>
                    <li>Handwriting should be clear and not too small</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            {currentMode === 'manual' && (
              <>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => handleSave(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader size={18} className="me-2 spinner-border spinner-border-sm" />
                  ) : (
                    <Save size={18} className="me-2" />
                  )}
                  Save as Draft
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => handleSave(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader size={18} className="me-2 spinner-border spinner-border-sm" />
                  ) : (
                    <Send size={18} className="me-2" />
                  )}
                  Submit to Admin
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultEntryModal;