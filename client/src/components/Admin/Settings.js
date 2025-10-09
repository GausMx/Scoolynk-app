import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- MOCK DATA (Nigeria) ---
const INITIAL_MOCK_DATA = {
  profile: {
    schoolName: 'Lagos International Academy',
    schoolEmail: 'admin@lagosacademy.edu.ng',
    phone: '+234 701 234 5678',
    address: '12 Victoria Island, Lagos, Nigeria',
    motto: 'Shaping minds for a brighter Nigeria.',
  },
  fees: {
    defaultFee: '120000.00',
    lateFee: '5000.00',
  },
  academic: {
    classes: ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'],
    subjects: ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics'],
    gradingSystem: 'A-F (5.0 Scale)',
    termStart: '2025-01-10',
    termEnd: '2025-12-20',
  },
};

let currentMockData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));

const mockFetchSettings = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return currentMockData;
};

const mockSaveSettings = async (section, payload) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (section !== 'security') currentMockData[section] = payload;
  if (section === 'security' && payload.newPassword !== payload.confirmPassword) {
    throw new Error('New password and confirm password do not match.');
  }
  return {
    message:
      section === 'security'
        ? 'Password changed successfully!'
        : `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully!`,
    status: 200,
  };
};

// --- STATUS MESSAGE COMPONENT ---
const StatusMessage = ({ status, message }) => {
  if (!message) return null;
  let alertClass = 'alert-info';
  if (status === 'success') alertClass = 'alert-success';
  else if (status === 'error') alertClass = 'alert-danger';
  return (
    <div className={`alert ${alertClass} rounded-3 d-flex align-items-center mb-4`} role="alert">
      <i
        className={`bi ${
          status === 'info'
            ? 'bi-hourglass-split'
            : status === 'success'
            ? 'bi-check-circle-fill'
            : 'bi-exclamation-triangle-fill'
        } me-2`}
      ></i>
      {message}
    </div>
  );
};

// --- SCHOOL CODE COMPONENT (real API, always visible) ---
const AdminSchoolCode = () => {
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const res = await axios.get('https://scoolynk-app.onrender.com/api/admin/school/code', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSchoolCode(res.data.schoolCode || '');
      } catch (err) {
        console.error('Error fetching school code:', err);
        setError('Failed to load school code. Please check your connection or login again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCode();
  }, []);

  return (
    <div className="card p-4 shadow-sm border-0 rounded-4 mt-4">
      <h5 className="text-primary fw-bold mb-3">
        <i className="bi bi-shield-lock-fill me-2"></i>School Code
      </h5>
      {loading ? (
        <p className="text-muted">Loading school code...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <p className="fs-5 fw-bold text-success">{schoolCode}</p>
      )}
      <small className="text-muted">
        Share this code with teachers and parents in your school. It’s required during registration.
      </small>
    </div>
  );
};


// --- MAIN SETTINGS COMPONENT ---
const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [profile, setProfile] = useState({});
  const [originalProfile, setOriginalProfile] = useState({});
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [fees, setFees] = useState({});
  const [academic, setAcademic] = useState({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setStatus({ type: 'info', message: 'Loading settings...' });
      const data = await mockFetchSettings();
      setProfile(data.profile || {});
      setOriginalProfile(data.profile || {});
      setFees(data.fees || {});
      setAcademic(data.academic || {});
      setStatus({ type: 'success', message: 'Settings loaded successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (status.type === 'success' || status.type === 'error') {
      const timer = setTimeout(() => setStatus({ type: null, message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleChange = (e, stateSetter) => {
    const { name, value } = e.target;
    stateSetter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (section) => {
    try {
      setLoading(true);
      setStatus({ type: 'info', message: 'Saving changes...' });
      let payload;
      switch (section) {
        case 'profile':
          payload = profile;
          break;
        case 'security':
          payload = security;
          break;
        case 'fees':
          payload = fees;
          break;
        case 'academic':
          payload = academic;
          break;
        default:
          payload = {};
      }
      const res = await mockSaveSettings(section, payload);
      setStatus({ type: 'success', message: res.message || 'Settings updated successfully!' });
      if (section !== 'security') await fetchSettings();
      if (section === 'security') setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditMode(false);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  const formatFieldName = (field) => field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  const handleCancelEdit = () => {
    if (activeTab === 'profile') setProfile(originalProfile);
    setEditMode(false);
  };

  const renderField = (field, value, stateSetter, type = 'text', readOnly = false) => {
    const isEditable = editMode && !readOnly;
    return (
      <div className="row mb-3" key={field}>
        <label className="col-12 col-md-4 col-form-label text-muted fw-bold mb-2 mb-md-0">
          {formatFieldName(field)}:
        </label>
        <div className="col-12 col-md-8">
          {isEditable ? (
            <input
              type={type}
              className="form-control rounded-3"
              name={field}
              value={value}
              onChange={(e) => handleChange(e, stateSetter)}
              readOnly={readOnly}
              disabled={readOnly}
              required
              placeholder={formatFieldName(field)}
            />
          ) : (
            <p className={`form-control-plaintext fw-bold ${readOnly ? 'text-secondary' : ''}`}>
              {type === 'number' && value ? `₦${value}` : value || 'N/A'}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderActionButtons = (section) => {
    if (section === 'security') return null;
    return (
      <div className="mt-4 pt-3 border-top d-flex flex-column flex-md-row justify-content-end gap-2">
        {!editMode ? (
          <button type="button" className="btn btn-outline-primary rounded-3 px-4" onClick={() => setEditMode(true)}>
            <i className="bi bi-pencil-fill me-2"></i>Edit {formatFieldName(section)}
          </button>
        ) : (
          <>
            <button type="submit" className="btn btn-primary rounded-3 px-4" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                'Save Changes'
              )}
            </button>
            <button type="button" className="btn btn-secondary rounded-3 px-4" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </button>
          </>
        )}
      </div>
    );
  };

  // --- SECTION RENDERERS ---
  const renderProfileSection = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSave('profile'); }}>
      <div className="mb-4">
        {renderField('schoolName', profile.schoolName, setProfile)}
        {renderField('schoolEmail', profile.schoolEmail, setProfile, 'email', true)}
        {renderField('phone', profile.phone, setProfile)}
        {renderField('address', profile.address, setProfile)}
        {renderField('motto', profile.motto, setProfile)}
      </div>

      {/* Insert the real school code display */}
      <AdminSchoolCode />

      {renderActionButtons('profile')}
    </form>
  );

  const renderSecuritySection = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSave('security'); }}>
      <h5 className="mb-4 text-primary text-center text-md-start">Change Administrator Password</h5>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          {renderField('currentPassword', security.currentPassword, setSecurity, 'password')}
          {renderField('newPassword', security.newPassword, setSecurity, 'password')}
          {renderField('confirmPassword', security.confirmPassword, setSecurity, 'password')}
        </div>
      </div>
      <div className="d-grid gap-2 col-12 col-md-6 mx-auto mt-4">
        <button type="submit" className="btn btn-primary rounded-3 btn-lg" disabled={loading}>
          {loading ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : (
            'Change Password'
          )}
        </button>
      </div>
    </form>
  );

  const renderFeesSection = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSave('fees'); }}>
      <h5 className="mb-4 text-primary text-center text-md-start">Fee Structure</h5>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          {renderField('defaultFee', fees.defaultFee, setFees, 'number')}
          {renderField('lateFee', fees.lateFee, setFees, 'number')}
        </div>
      </div>
      {renderActionButtons('fees')}
    </form>
  );

  const renderAcademicSection = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSave('academic'); }}>
      <h5 className="mb-4 text-primary text-center text-md-start">Academic Term & Grading</h5>
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          {renderField('gradingSystem', academic.gradingSystem, setAcademic)}
          {renderField('termStart', academic.termStart, setAcademic, editMode ? 'date' : 'text')}
          {renderField('termEnd', academic.termEnd, setAcademic, editMode ? 'date' : 'text')}
        </div>
      </div>
      <div className="row mb-3 border-top pt-3">
        <div className="col-12 col-md-4 col-form-label text-muted fw-bold">Classes:</div>
        <div className="col-12 col-md-8">
          <p className="form-control-plaintext fw-bold text-success">
            {academic.classes?.join(', ') || 'None configured'}
          </p>
          <small className="text-warning">
            {editMode && "Note: Classes and Subjects require a complex editor and are only displayed here."}
          </small>
        </div>
      </div>
      {renderActionButtons('academic')}
    </form>
  );

  return (
    <div className="container py-5">
      <header className="mb-5 border-bottom pb-3 text-center text-md-start">
        <h1 className="text-primary fw-bolder">
          <i className="bi bi-gear-fill me-2"></i>School Settings Management
        </h1>
        <p className="text-muted">Configure core school information, fees, and academic parameters.</p>
      </header>

      <StatusMessage status={status.type} message={status.message} />

      <ul className="nav nav-tabs flex-wrap mb-4 justify-content-center justify-content-md-start">
        {['profile', 'security', 'fees', 'academic'].map((id) => (
          <li className="nav-item" key={id}>
            <button
              className={`nav-link ${activeTab === id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(id);
                setEditMode(false);
              }}
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-3 p-md-5">
          {activeTab === 'profile' && renderProfileSection()}
          {activeTab === 'security' && renderSecuritySection()}
          {activeTab === 'fees' && renderFeesSection()}
          {activeTab === 'academic' && renderAcademicSection()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
