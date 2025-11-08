// src/components/Admin/VisualTemplateBuilder.js
// Visual drag-and-drop template builder for non-tech admins

import React, { useState, useEffect } from 'react';
import { 
  Save, Eye, EyeOff, ChevronDown, ChevronUp, 
  Plus, Trash2, Check, X 
} from 'lucide-react';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const DEFAULT_SCORE_COLUMNS = [
  { name: 'CA1', maxScore: 20, enabled: true, editable: true },
  { name: 'CA2', maxScore: 20, enabled: true, editable: true },
  { name: 'Exam', maxScore: 60, enabled: true, editable: true },
  { name: 'Total', maxScore: 100, enabled: true, editable: false, calculated: true },
  { name: 'Grade', maxScore: 0, enabled: true, editable: false, calculated: true }
];

const DEFAULT_AFFECTIVE_TRAITS = [
  { name: 'Punctuality', enabled: true },
  { name: 'Behaviour', enabled: true },
  { name: 'Neatness', enabled: true },
  { name: 'Relationship', enabled: true },
  { name: 'Attentiveness', enabled: true },
  { name: 'Initiative', enabled: true }
];

const DEFAULT_FEE_TYPES = [
  { name: 'Tuition', enabled: true },
  { name: 'Uniform', enabled: true },
  { name: 'Books', enabled: true },
  { name: 'Lesson', enabled: true },
  { name: 'Other', enabled: true }
];

const VisualTemplateBuilder = ({ 
  schoolId, 
  token: propToken, 
  onClose, 
  existingTemplate = null 
}) => {
  // Get token from props or localStorage (like Settings.js does)
  const token = propToken || localStorage.getItem('token');
  
  const [templateName, setTemplateName] = useState(existingTemplate?.name || '');
  const [term, setTerm] = useState(existingTemplate?.term || 'First Term');
  const [session, setSession] = useState(existingTemplate?.session || '');
  
  // School info state
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    address: '',
    motto: ''
  });
  
  // Component toggles
  const [components, setComponents] = useState({
    header: existingTemplate?.components?.header?.enabled ?? true,
    studentInfo: existingTemplate?.components?.studentInfo?.enabled ?? true,
    scoresTable: existingTemplate?.components?.scoresTable?.enabled ?? true,
    affectiveTraits: existingTemplate?.components?.affectiveTraits?.enabled ?? true,
    fees: existingTemplate?.components?.fees?.enabled ?? true,
    attendance: existingTemplate?.components?.attendance?.enabled ?? true,
    comments: existingTemplate?.components?.comments?.enabled ?? true,
    signatures: existingTemplate?.components?.signatures?.enabled ?? false
  });

  // Expandable sections
  const [expanded, setExpanded] = useState({
    header: false,
    studentInfo: false,
    scoresTable: true,
    affectiveTraits: false,
    fees: false,
    attendance: false,
    comments: false,
    signatures: false
  });

  // Score table configuration
  const [scoreColumns, setScoreColumns] = useState(
    existingTemplate?.components?.scoresTable?.columns || DEFAULT_SCORE_COLUMNS
  );
  const [defaultSubjectRows, setDefaultSubjectRows] = useState(
    existingTemplate?.components?.scoresTable?.defaultSubjects || 12
  );

  // Affective traits configuration
  const [affectiveTraits, setAffectiveTraits] = useState(
    existingTemplate?.components?.affectiveTraits?.traits || DEFAULT_AFFECTIVE_TRAITS
  );

  // Fee types configuration
  const [feeTypes, setFeeTypes] = useState(
    existingTemplate?.components?.fees?.types || DEFAULT_FEE_TYPES
  );

  // Comments configuration
  const [enableTeacherComment, setEnableTeacherComment] = useState(
    existingTemplate?.components?.comments?.teacher ?? true
  );
  const [enablePrincipalComment, setEnablePrincipalComment] = useState(
    existingTemplate?.components?.comments?.principal ?? true
  );

  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch school info on mount
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
          headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
        });
        
        const { school } = res.data;
        setSchoolInfo({
          name: school.name || 'Your School Name',
          address: school.address || 'School Address, City, State',
          motto: school.motto || ''
        });
      } catch (err) {
        console.error('Failed to fetch school info:', err);
        // Use default values if fetch fails
        setSchoolInfo({
          name: 'Your School Name',
          address: 'School Address, City, State',
          motto: ''
        });
      }
    };

    if (token) {
      fetchSchoolInfo();
    }
  }, [token]);

  const toggleComponent = (component) => {
    setComponents({ ...components, [component]: !components[component] });
  };

  const toggleExpanded = (section) => {
    setExpanded({ ...expanded, [section]: !expanded[section] });
  };

  const updateScoreColumn = (index, field, value) => {
    const updated = [...scoreColumns];
    updated[index][field] = value;
    setScoreColumns(updated);
  };

  const addScoreColumn = () => {
    setScoreColumns([
      ...scoreColumns,
      { name: 'New Column', maxScore: 0, enabled: true, editable: true }
    ]);
  };

  const removeScoreColumn = (index) => {
    setScoreColumns(scoreColumns.filter((_, i) => i !== index));
  };

  const addAffectiveTrait = () => {
    setAffectiveTraits([
      ...affectiveTraits,
      { name: 'New Trait', enabled: true }
    ]);
  };

  const updateAffectiveTrait = (index, value) => {
    const updated = [...affectiveTraits];
    updated[index].name = value;
    setAffectiveTraits(updated);
  };

  const removeAffectiveTrait = (index) => {
    setAffectiveTraits(affectiveTraits.filter((_, i) => i !== index));
  };

  const addFeeType = () => {
    setFeeTypes([
      ...feeTypes,
      { name: 'New Fee', enabled: true }
    ]);
  };

  const updateFeeType = (index, value) => {
    const updated = [...feeTypes];
    updated[index].name = value;
    setFeeTypes(updated);
  };

  const removeFeeType = (index) => {
    setFeeTypes(feeTypes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate token
      if (!token) {
        setError('Authentication token is missing. Please log in again.');
        setSaving(false);
        return;
      }

      if (!templateName || !term || !session) {
        setError('Please fill in template name, term, and session');
        setSaving(false);
        return;
      }

      const templateData = {
        name: templateName,
        term,
        session,
        schoolId,
        components: {
          header: { enabled: components.header },
          studentInfo: { enabled: components.studentInfo },
          scoresTable: {
            enabled: components.scoresTable,
            columns: scoreColumns,
            defaultSubjects: defaultSubjectRows
          },
          affectiveTraits: {
            enabled: components.affectiveTraits,
            traits: affectiveTraits
          },
          fees: {
            enabled: components.fees,
            types: feeTypes
          },
          attendance: { enabled: components.attendance },
          comments: {
            enabled: components.comments,
            teacher: enableTeacherComment,
            principal: enablePrincipalComment
          },
          signatures: { enabled: components.signatures }
        }
      };

      const url = existingTemplate
        ? `${REACT_APP_API_URL}/api/admin/templates/${existingTemplate._id}`
        : `${REACT_APP_API_URL}/api/admin/templates`;

      const method = existingTemplate ? 'put' : 'post';

      // Check if token already has "Bearer" prefix
      const authHeader = token.startsWith('Bearer ') 
        ? token 
        : `Bearer ${token}`;

      const res = await axios[method](url, templateData, {
        headers: { Authorization: authHeader }
      });

      alert(res.data.message || 'Template saved successfully!');
      if (onClose) onClose();

    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4>
              {existingTemplate ? 'Edit' : 'Create'} Result Template
            </h4>
            <button className="btn btn-outline-secondary" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Basic Info */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Template Name *</label>
          <input
            type="text"
            className="form-control"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Primary 3 Result Sheet"
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Term *</label>
          <select className="form-select" value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Session *</label>
          <input
            type="text"
            className="form-control"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="e.g., 2024/2025"
          />
        </div>
      </div>

      {/* Toggle Preview */}
      <div className="row mb-3">
        <div className="col-12">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ms-1">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
        </div>
      </div>

      <div className="row">
        {/* Configuration Panel */}
        <div className={showPreview ? 'col-lg-6' : 'col-12'}>
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">Template Components</h6>
            </div>
            <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Header Section */}
              <div className="border rounded mb-3">
                <div 
                  className="d-flex justify-content-between align-items-center p-3 bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpanded('header')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.header}
                      onChange={() => toggleComponent('header')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label fw-bold">
                      School Header
                    </label>
                  </div>
                  {expanded.header ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expanded.header && components.header && (
                  <div className="p-3">
                    <small className="text-muted">
                      Includes school name, logo, address, and motto
                    </small>
                  </div>
                )}
              </div>

              {/* Student Info Section */}
              <div className="border rounded mb-3">
                <div 
                  className="d-flex justify-content-between align-items-center p-3 bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpanded('studentInfo')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.studentInfo}
                      onChange={() => toggleComponent('studentInfo')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label fw-bold">
                      Student Information
                    </label>
                  </div>
                  {expanded.studentInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expanded.studentInfo && components.studentInfo && (
                  <div className="p-3">
                    <small className="text-muted">
                      Includes name, registration number, class, and session
                    </small>
                  </div>
                )}
              </div>

              {/* Scores Table Section */}
              <div className="border rounded mb-3">
                <div 
                  className="d-flex justify-content-between align-items-center p-3 bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpanded('scoresTable')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.scoresTable}
                      onChange={() => toggleComponent('scoresTable')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label fw-bold">
                      Subject Scores Table
                    </label>
                  </div>
                  {expanded.scoresTable ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expanded.scoresTable && components.scoresTable && (
                  <div className="p-3">
                    <div className="mb-3">
                      <label className="form-label small">Default Number of Subject Rows</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={defaultSubjectRows}
                        onChange={(e) => setDefaultSubjectRows(Math.max(1, Number(e.target.value)))}
                        min="1"
                        max="20"
                      />
                      <small className="text-muted">Teachers can add/remove rows as needed</small>
                    </div>

                    <label className="form-label small fw-bold">Score Columns</label>
                    {scoreColumns.map((col, index) => (
                      <div key={index} className="d-flex gap-2 mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={col.name}
                          onChange={(e) => updateScoreColumn(index, 'name', e.target.value)}
                          placeholder="Column name"
                          disabled={col.calculated}
                        />
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={col.maxScore}
                          onChange={(e) => updateScoreColumn(index, 'maxScore', Number(e.target.value))}
                          placeholder="Max"
                          style={{ width: '80px' }}
                          disabled={col.calculated}
                        />
                        {!col.calculated && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeScoreColumn(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={addScoreColumn}
                    >
                      <Plus size={14} className="me-1" />
                      Add Column
                    </button>
                  </div>
                )}
              </div>

              {/* Affective Traits Section */}
              <div className="border rounded mb-3">
                <div 
                  className="d-flex justify-content-between align-items-center p-3 bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpanded('affectiveTraits')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.affectiveTraits}
                      onChange={() => toggleComponent('affectiveTraits')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label fw-bold">
                      Affective Traits
                    </label>
                  </div>
                  {expanded.affectiveTraits ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expanded.affectiveTraits && components.affectiveTraits && (
                  <div className="p-3">
                    <small className="text-muted d-block mb-2">Rating scale: 1-5</small>
                    {affectiveTraits.map((trait, index) => (
                      <div key={index} className="d-flex gap-2 mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={trait.name}
                          onChange={(e) => updateAffectiveTrait(index, e.target.value)}
                          placeholder="Trait name"
                        />
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeAffectiveTrait(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={addAffectiveTrait}
                    >
                      <Plus size={14} className="me-1" />
                      Add Trait
                    </button>
                  </div>
                )}
              </div>

              {/* Fees Section */}
              <div className="border rounded mb-3">
                <div 
                  className="d-flex justify-content-between align-items-center p-3 bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpanded('fees')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.fees}
                      onChange={() => toggleComponent('fees')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label fw-bold">
                      School Fees
                    </label>
                  </div>
                  {expanded.fees ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expanded.fees && components.fees && (
                  <div className="p-3">
                    {feeTypes.map((fee, index) => (
                      <div key={index} className="d-flex gap-2 mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={fee.name}
                          onChange={(e) => updateFeeType(index, e.target.value)}
                          placeholder="Fee type"
                        />
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFeeType(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={addFeeType}
                    >
                      <Plus size={14} className="me-1" />
                      Add Fee Type
                    </button>
                  </div>
                )}
              </div>

              {/* Attendance Section */}
              <div className="border rounded mb-3">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.attendance}
                      onChange={() => toggleComponent('attendance')}
                    />
                    <label className="form-check-label fw-bold">
                      Attendance
                    </label>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border rounded mb-3">
                <div 
                  className="d-flex justify-content-between align-items-center p-3 bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpanded('comments')}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.comments}
                      onChange={() => toggleComponent('comments')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="form-check-label fw-bold">
                      Comments
                    </label>
                  </div>
                  {expanded.comments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expanded.comments && components.comments && (
                  <div className="p-3">
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={enableTeacherComment}
                        onChange={(e) => setEnableTeacherComment(e.target.checked)}
                      />
                      <label className="form-check-label">Teacher's Comment</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={enablePrincipalComment}
                        onChange={(e) => setEnablePrincipalComment(e.target.checked)}
                      />
                      <label className="form-check-label">Principal's Comment</label>
                    </div>
                  </div>
                )}
              </div>

              {/* Signatures Section */}
              <div className="border rounded mb-3">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={components.signatures}
                      onChange={() => toggleComponent('signatures')}
                    />
                    <label className="form-check-label fw-bold">
                      Signatures
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Save Button */}
          <div className="mt-3">
            <button 
              className="btn btn-success btn-lg w-100"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="me-2" />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="col-lg-6">
            <div className="card sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">Live Preview</h6>
              </div>
              <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="border p-4 bg-white" style={{ fontSize: '14px' }}>
                  
                  {/* Header */}
                  {components.header && (
                    <div className="text-center mb-4 pb-3 border-bottom">
                      <h5 className="fw-bold mb-1">{schoolInfo.name}</h5>
                      <small className="text-muted">{schoolInfo.address}</small>
                      {schoolInfo.motto && (
                        <div className="fst-italic text-muted small mt-1">"{schoolInfo.motto}"</div>
                      )}
                      <div className="mt-2 fw-bold">{term} Report Card - {session}</div>
                    </div>
                  )}

                  {/* Student Info */}
                  {components.studentInfo && (
                    <div className="row mb-3">
                      <div className="col-6">
                        <small><strong>Name:</strong> Student Name</small>
                      </div>
                      <div className="col-6">
                        <small><strong>Reg No:</strong> ABC/001</small>
                      </div>
                      <div className="col-6">
                        <small><strong>Class:</strong> Primary 3</small>
                      </div>
                      <div className="col-6">
                        <small><strong>Session:</strong> {session}</small>
                      </div>
                    </div>
                  )}

                  {/* Scores Table */}
                  {components.scoresTable && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">Academic Performance</h6>
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Subject</th>
                            {scoreColumns.filter(c => c.enabled).map((col, i) => (
                              <th key={i} className="text-center">
                                {col.name}
                                {col.maxScore > 0 && <small className="d-block text-muted">({col.maxScore})</small>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Mathematics</td>
                            {scoreColumns.filter(c => c.enabled).map((col, i) => (
                              <td key={i} className="text-center">-</td>
                            ))}
                          </tr>
                          <tr>
                            <td>English</td>
                            {scoreColumns.filter(c => c.enabled).map((col, i) => (
                              <td key={i} className="text-center">-</td>
                            ))}
                          </tr>
                          <tr>
                            <td colSpan={scoreColumns.filter(c => c.enabled).length + 1} className="text-muted text-center">
                              <small>+ More subjects...</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Affective Traits */}
                  {components.affectiveTraits && affectiveTraits.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">Affective Traits (1-5)</h6>
                      <div className="row">
                        {affectiveTraits.map((trait, i) => (
                          <div key={i} className="col-6 mb-1">
                            <small>{trait.name}: ___</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fees */}
                  {components.fees && feeTypes.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">School Fees</h6>
                      {feeTypes.map((fee, i) => (
                        <div key={i} className="d-flex justify-content-between mb-1">
                          <small>{fee.name}:</small>
                          <small>₦ ________</small>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attendance */}
                  {components.attendance && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">Attendance</h6>
                      <div className="row">
                        <div className="col-4">
                          <small>Opened: ___</small>
                        </div>
                        <div className="col-4">
                          <small>Present: ___</small>
                        </div>
                        <div className="col-4">
                          <small>Absent: ___</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {components.comments && (
                    <div className="mb-3">
                      {enableTeacherComment && (
                        <div className="mb-2">
                          <small className="fw-bold">Teacher's Comment:</small>
                          <div className="border p-2 mt-1" style={{ minHeight: '40px' }}>
                            <small className="text-muted">Comment text will appear here...</small>
                          </div>
                        </div>
                      )}
                      {enablePrincipalComment && (
                        <div>
                          <small className="fw-bold">Principal's Comment:</small>
                          <div className="border p-2 mt-1" style={{ minHeight: '40px' }}>
                            <small className="text-muted">Comment text will appear here...</small>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signatures */}
                  {components.signatures && (
                    <div className="row mt-4">
                      <div className="col-6">
                        <div className="border-top pt-2">
                          <small>Teacher's Signature</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="border-top pt-2">
                          <small>Principal's Signature</small>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualTemplateBuilder;