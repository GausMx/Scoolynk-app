// src/components/Teacher/ResultEntryModal.js - COMPLETE RESULT ENTRY WITH OCR

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Send, Upload, Scan, Plus, Trash2, AlertCircle } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const COMMON_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Yoruba Language',
  'Social Studies',
  'Basic Science',
  'Basic Technology',
  'Computer Science',
  'History',
  'Agricultural Science',
  'Civic Education',
  'Business Studies'
];

const ResultEntryModal = ({ 
  mode, // 'manual' or 'scan'
  student, 
  existingResult, 
  term, 
  session, 
  onClose, 
  onSuccess,
  token 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMode, setCurrentMode] = useState(mode);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  
  // Form state
  const [subjects, setSubjects] = useState([]);
  const [affectiveTraits, setAffectiveTraits] = useState({
    punctuality: 3,
    behaviour: 3,
    neatness: 3,
    relationship: 3,
    attentiveness: 3,
    initiative: 3
  });
  const [fees, setFees] = useState({
    tuition: 0,
    uniform: 0,
    books: 0,
    lesson: 0,
    other: 0
  });
  const [attendance, setAttendance] = useState({
    opened: 0,
    present: 0,
    absent: 0
  });
  const [comments, setComments] = useState({
    teacher: '',
    principal: ''
  });

  // OCR state
  const [scanImage, setScanImage] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Fetch result template
  useEffect(() => {
    fetchTemplate();
  }, [term, session]);

  const fetchTemplate = async () => {
    try {
      setLoadingTemplate(true);
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/teacher/results/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term, session }
        }
      );
      setTemplate(res.data.template);
    } catch (err) {
      console.log('No template found:', err);
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    if (existingResult) {
      // Load existing result data
      setSubjects(existingResult.subjects || []);
      setAffectiveTraits(existingResult.affectiveTraits || affectiveTraits);
      setFees(existingResult.fees || fees);
      setAttendance(existingResult.attendance || attendance);
      setComments(existingResult.comments || comments);
    } else {
      // Initialize with common subjects
      setSubjects(COMMON_SUBJECTS.map(subject => ({
        subject,
        ca1: 0,
        ca2: 0,
        exam: 0
      })));
    }
  }, [existingResult]);

  const addSubject = () => {
    setSubjects([...subjects, { subject: '', ca1: 0, ca2: 0, exam: 0 }]);
  };

  const removeSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const handleSave = async (submitToAdmin = false) => {
    try {
      setLoading(true);
      setError('');

      // Validate subjects
      const validSubjects = subjects.filter(s => s.subject && s.subject.trim() !== '');
      if (validSubjects.length === 0) {
        setError('Please add at least one subject with scores.');
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
        status: submitToAdmin ? 'submitted' : 'draft'
      };

      if (existingResult) {
        payload.resultId = existingResult._id;
      }

      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/results`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScanImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!scanImage) {
      setError('Please upload an image first');
      return;
    }

    try {
      setScanning(true);
      setError('');

      const res = await axios.post(
        `${REACT_APP_API_URL}/api/teacher/results/scan`,
        {
          base64Image: scanImage,
          studentId: student._id,
          term,
          session
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Load scanned data into form
      if (res.data.result) {
        setSubjects(res.data.result.subjects || []);
        alert('Scores scanned successfully! Please review and edit if needed.');
        setCurrentMode('manual'); // Switch to manual mode for editing
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan image');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Result Entry - {student.name} ({student.regNo})
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger d-flex align-items-center">
                <AlertCircle size={20} className="me-2" />
                {error}
              </div>
            )}

            {/* Mode Toggle */}
            <div className="btn-group mb-4" role="group">
              <button 
                type="button" 
                className={`btn ${currentMode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentMode('manual')}
              >
                Manual Entry
              </button>
              <button 
                type="button" 
                className={`btn ${currentMode === 'scan' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentMode('scan')}
              >
                Scan Scores (OCR)
              </button>
            </div>

            {/* OCR Scanning Interface */}
            {currentMode === 'scan' && (
              <div className="mb-4">
                <h6 className="mb-3">Upload Score Sheet Image</h6>
                <div className="row">
                  <div className="col-md-6">
                    <input 
                      type="file" 
                      className="form-control mb-3"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={handleScan}
                      disabled={!scanImage || scanning}
                    >
                      {scanning ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Scan size={18} className="me-2" />
                          Scan & Extract Scores
                        </>
                      )}
                    </button>
                  </div>
                  <div className="col-md-6">
                    {scanImage && (
                      <div className="border rounded p-2">
                        <img 
                          src={scanImage} 
                          alt="Score sheet" 
                          className="img-fluid"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="alert alert-info mt-3">
                  <small>
                    <strong>Tips for better OCR results:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Ensure the image is clear and well-lit</li>
                      <li>Scores should be written clearly in boxes/columns</li>
                      <li>Include subject names in the image</li>
                      <li>After scanning, review and edit scores before submitting</li>
                    </ul>
                  </small>
                </div>
              </div>
            )}

            {/* Manual Entry Form */}
            {currentMode === 'manual' && (
              <>
                {/* Subjects Table */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Subjects & Scores</h6>
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
                          <th style={{ width: '12%' }}>Grade</th>
                          <th style={{ width: '10%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject, index) => {
                          const total = (Number(subject.ca1) || 0) + (Number(subject.ca2) || 0) + (Number(subject.exam) || 0);
                          const percent = (total / 100) * 100;
                          let grade = 'F';
                          if (percent >= 70) grade = 'A';
                          else if (percent >= 60) grade = 'B';
                          else if (percent >= 50) grade = 'C';
                          else if (percent >= 40) grade = 'D';

                          return (
                            <tr key={index}>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm"
                                  value={subject.subject}
                                  onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                                  list="subject-suggestions"
                                />
                                <datalist id="subject-suggestions">
                                  {COMMON_SUBJECTS.map(s => (
                                    <option key={s} value={s} />
                                  ))}
                                </datalist>
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm"
                                  value={subject.ca1}
                                  onChange={(e) => updateSubject(index, 'ca1', Math.min(20, Math.max(0, Number(e.target.value))))}
                                  min="0"
                                  max="20"
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm"
                                  value={subject.ca2}
                                  onChange={(e) => updateSubject(index, 'ca2', Math.min(20, Math.max(0, Number(e.target.value))))}
                                  min="0"
                                  max="20"
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm"
                                  value={subject.exam}
                                  onChange={(e) => updateSubject(index, 'exam', Math.min(60, Math.max(0, Number(e.target.value))))}
                                  min="0"
                                  max="60"
                                />
                              </td>
                              <td className="text-center fw-bold">{total}</td>
                              <td className="text-center">
                                <span className={`badge bg-${
                                  grade === 'A' ? 'success' :
                                  grade === 'B' ? 'primary' :
                                  grade === 'C' ? 'info' :
                                  grade === 'D' ? 'warning' : 'danger'
                                }`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="text-center">
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeSubject(index)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Affective Traits */}
                <div className="mb-4">
                  <h6 className="mb-3">Affective Traits (1-5 Rating)</h6>
                  <div className="row g-3">
                    {Object.keys(affectiveTraits).map(trait => (
                      <div key={trait} className="col-md-4">
                        <label className="form-label text-capitalize">{trait}</label>
                        <input 
                          type="number"
                          className="form-control"
                          value={affectiveTraits[trait]}
                          onChange={(e) => setAffectiveTraits({
                            ...affectiveTraits,
                            [trait]: Math.min(5, Math.max(1, Number(e.target.value)))
                          })}
                          min="1"
                          max="5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fees */}
                <div className="mb-4">
                  <h6 className="mb-3">School Fees (₦)</h6>
                  <div className="row g-3">
                    {Object.keys(fees).map(feeType => (
                      <div key={feeType} className="col-md-4">
                        <label className="form-label text-capitalize">{feeType}</label>
                        <input 
                          type="number"
                          className="form-control"
                          value={fees[feeType]}
                          onChange={(e) => setFees({
                            ...fees,
                            [feeType]: Math.max(0, Number(e.target.value))
                          })}
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <strong>Total Fees: ₦{Object.values(fees).reduce((sum, val) => sum + Number(val), 0).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Attendance */}
                <div className="mb-4">
                  <h6 className="mb-3">Attendance</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Days Opened</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={attendance.opened}
                        onChange={(e) => setAttendance({
                          ...attendance,
                          opened: Math.max(0, Number(e.target.value))
                        })}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Days Present</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={attendance.present}
                        onChange={(e) => setAttendance({
                          ...attendance,
                          present: Math.max(0, Number(e.target.value))
                        })}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Days Absent</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={attendance.absent}
                        onChange={(e) => setAttendance({
                          ...attendance,
                          absent: Math.max(0, Number(e.target.value))
                        })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="mb-4">
                  <h6 className="mb-3">Comments</h6>
                  <div className="mb-3">
                    <label className="form-label">Teacher's Comment</label>
                    <textarea 
                      className="form-control"
                      rows="3"
                      value={comments.teacher}
                      onChange={(e) => setComments({
                        ...comments,
                        teacher: e.target.value
                      })}
                      placeholder="Enter your comment about the student's performance..."
                    ></textarea>
                  </div>
                </div>
              </>
            )}
          </div>

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
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <Save size={18} className="me-2" />
                      Save as Draft
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => handleSave(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <Send size={18} className="me-2" />
                      Submit to Admin
                    </>
                  )}
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