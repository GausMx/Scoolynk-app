// src/components/Teacher/VisualResultEntry.js
// Clean form-based result entry using visual template

import React, { useState, useEffect } from 'react';
import { Save, Send, Plus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const VisualResultEntry = ({
  student,
  template,
  existingResult = null,
  term,
  session,
  token,
  onClose,
  onSuccess
}) => {
  const [subjects, setSubjects] = useState([]);
  const [affectiveTraits, setAffectiveTraits] = useState({});
  const [fees, setFees] = useState({});
  const [attendance, setAttendance] = useState({ opened: 0, present: 0, absent: 0 });
  const [comments, setComments] = useState({ teacher: '', principal: '' });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize from existing result or template defaults
  useEffect(() => {
    if (existingResult) {
      setSubjects(existingResult.subjects || []);
      setAffectiveTraits(existingResult.affectiveTraits || {});
      setFees(existingResult.fees || {});
      setAttendance(existingResult.attendance || { opened: 0, present: 0, absent: 0 });
      setComments(existingResult.comments || { teacher: '', principal: '' });
    } else if (template) {
      // Initialize with template defaults
      const defaultSubjects = [];
      const subjectCount = template.components?.scoresTable?.defaultSubjects || 12;
      
      for (let i = 0; i < subjectCount; i++) {
        const subjectData = { subject: '' };
        template.components?.scoresTable?.columns?.forEach(col => {
          if (col.editable) {
            subjectData[col.name.toLowerCase().replace(/\s+/g, '')] = 0;
          }
        });
        defaultSubjects.push(subjectData);
      }
      setSubjects(defaultSubjects);

      // Initialize affective traits
      const traits = {};
      template.components?.affectiveTraits?.traits?.forEach(trait => {
        traits[trait.name.toLowerCase().replace(/\s+/g, '')] = 3;
      });
      setAffectiveTraits(traits);

      // Initialize fees
      const feeData = {};
      template.components?.fees?.types?.forEach(fee => {
        feeData[fee.name.toLowerCase().replace(/\s+/g, '')] = 0;
      });
      setFees(feeData);
    }
  }, [existingResult, template]);

  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const addSubjectRow = () => {
    const newSubject = { subject: '' };
    template.components?.scoresTable?.columns?.forEach(col => {
      if (col.editable) {
        newSubject[col.name.toLowerCase().replace(/\s+/g, '')] = 0;
      }
    });
    setSubjects([...subjects, newSubject]);
  };

  const removeSubjectRow = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const calculateTotal = (subject) => {
    let total = 0;
    template.components?.scoresTable?.columns?.forEach(col => {
      if (col.editable) {
        const fieldName = col.name.toLowerCase().replace(/\s+/g, '');
        total += Number(subject[fieldName]) || 0;
      }
    });
    return total;
  };

  const calculateGrade = (total) => {
    const percentage = total;
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleSave = async (submitToAdmin = false) => {
    try {
      setLoading(true);
      setError('');

      // Validate subjects
      const validSubjects = subjects.filter(s => s.subject && s.subject.trim() !== '');
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

      alert(res.data.message || 'Result saved successfully!');
      if (onSuccess) onSuccess(res.data);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  if (!template) {
    return (
      <div className="alert alert-warning">
        <AlertCircle size={20} className="me-2" />
        No template found for {term}, {session}. Please contact admin to create a template.
      </div>
    );
  }

  const components = template.components || {};
  const scoreColumns = components.scoresTable?.columns || [];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          
          {/* Header */}
          <div className="modal-header">
            <div>
              <h5 className="modal-title">Result Entry - {student?.name}</h5>
              <small className="text-muted">Using: {template.name}</small>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger d-flex align-items-center">
                <AlertCircle size={20} className="me-2" />
                {error}
              </div>
            )}

            <div className="card">
              <div className="card-body">

                {/* Header Section */}
                {components.header?.enabled && (
                  <div className="text-center mb-4 pb-3 border-bottom">
                    <h5 className="fw-bold mb-1">SCHOOL NAME</h5>
                    <small className="text-muted">School Address</small>
                    <div className="mt-2 fw-bold">{term} Report Card - {session}</div>
                  </div>
                )}

                {/* Student Info */}
                {components.studentInfo?.enabled && (
                  <div className="row mb-4">
                    <div className="col-md-6 mb-2">
                      <strong>Name:</strong> {student.name}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Reg No:</strong> {student.regNo}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Class:</strong> {student.classId?.name}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Session:</strong> {session}
                    </div>
                  </div>
                )}

                {/* Scores Table */}
                {components.scoresTable?.enabled && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Academic Performance</h6>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={addSubjectRow}
                      >
                        <Plus size={16} className="me-1" />
                        Add Subject
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Subject</th>
                            {scoreColumns.filter(c => c.enabled).map((col, i) => (
                              <th key={i} className="text-center" style={{ minWidth: '80px' }}>
                                {col.name}
                                {col.maxScore > 0 && (
                                  <small className="d-block text-muted">({col.maxScore})</small>
                                )}
                              </th>
                            ))}
                            <th style={{ width: '50px' }}></th>
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
                                    onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                                    placeholder="Subject name"
                                  />
                                </td>
                                {scoreColumns.filter(c => c.enabled).map((col, colIndex) => {
                                  if (col.calculated) {
                                    // Show calculated fields
                                    if (col.name.toLowerCase().includes('total')) {
                                      return (
                                        <td key={colIndex} className="text-center fw-bold">
                                          {total}
                                        </td>
                                      );
                                    } else if (col.name.toLowerCase().includes('grade')) {
                                      return (
                                        <td key={colIndex} className="text-center fw-bold">
                                          {grade}
                                        </td>
                                      );
                                    }
                                    return <td key={colIndex} className="text-center">-</td>;
                                  } else {
                                    // Editable fields
                                    const fieldName = col.name.toLowerCase().replace(/\s+/g, '');
                                    return (
                                      <td key={colIndex}>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-center"
                                          value={subject[fieldName] || 0}
                                          onChange={(e) => updateSubject(
                                            index,
                                            fieldName,
                                            Math.min(col.maxScore, Math.max(0, Number(e.target.value)))
                                          )}
                                          min="0"
                                          max={col.maxScore}
                                        />
                                      </td>
                                    );
                                  }
                                })}
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeSubjectRow(index)}
                                    title="Remove subject"
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
                )}

                <div className="row">
                  {/* Affective Traits */}
                  {components.affectiveTraits?.enabled && (
                    <div className="col-md-6 mb-4">
                      <h6 className="fw-bold mb-3">Affective Traits (1-5)</h6>
                      <div className="row g-2">
                        {components.affectiveTraits.traits?.map((trait, index) => {
                          const key = trait.name.toLowerCase().replace(/\s+/g, '');
                          return (
                            <div key={index} className="col-6">
                              <div className="input-group input-group-sm">
                                <span className="input-group-text" style={{ minWidth: '120px' }}>
                                  {trait.name}
                                </span>
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  value={affectiveTraits[key] || 3}
                                  onChange={(e) => setAffectiveTraits({
                                    ...affectiveTraits,
                                    [key]: Math.min(5, Math.max(1, Number(e.target.value)))
                                  })}
                                  min="1"
                                  max="5"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fees */}
                  {components.fees?.enabled && (
                    <div className="col-md-6 mb-4">
                      <h6 className="fw-bold mb-3">School Fees (₦)</h6>
                      <div className="row g-2">
                        {components.fees.types?.map((fee, index) => {
                          const key = fee.name.toLowerCase().replace(/\s+/g, '');
                          return (
                            <div key={index} className="col-6">
                              <div className="input-group input-group-sm">
                                <span className="input-group-text" style={{ minWidth: '100px' }}>
                                  {fee.name}
                                </span>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={fees[key] || 0}
                                  onChange={(e) => setFees({
                                    ...fees,
                                    [key]: Math.max(0, Number(e.target.value))
                                  })}
                                  min="0"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attendance */}
                {components.attendance?.enabled && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Attendance</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <label className="form-label small">Days Opened</label>
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
                        <label className="form-label small">Days Present</label>
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
                        <label className="form-label small">Days Absent</label>
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
                )}

                {/* Comments */}
                {components.comments?.enabled && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-3">Comments</h6>
                    {components.comments.teacher && (
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
                        />
                      </div>
                    )}
                    {components.comments.principal && (
                      <div className="mb-3">
                        <label className="form-label">Principal's Comment (Optional)</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={comments.principal}
                          onChange={(e) => setComments({
                            ...comments,
                            principal: e.target.value
                          })}
                          placeholder="Principal's comment (will be added later if blank)..."
                        />
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
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
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
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
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <Send size={18} className="me-2" />
              )}
              Submit to Admin
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VisualResultEntry;