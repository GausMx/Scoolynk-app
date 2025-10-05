// src/components/Admin/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // ----- Form states -----
  const [profile, setProfile] = useState({
    schoolName: '',
    schoolEmail: '',
    phone: '',
    address: '',
    motto: '',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [fees, setFees] = useState({
    defaultFee: '',
    lateFee: '',
  });

  const [academic, setAcademic] = useState({
    classes: [],
    subjects: [],
    gradingSystem: '',
    termStart: '',
    termEnd: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ----- Fetch existing settings from backend -----
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings'); // replace with your API endpoint
        const data = res.data;
        setProfile({
          schoolName: data.schoolName || '',
          schoolEmail: data.schoolEmail || '',
          phone: data.phone || '',
          address: data.address || '',
          motto: data.motto || '',
        });
        setFees({
          defaultFee: data.defaultFee || '',
          lateFee: data.lateFee || '',
        });
        setAcademic({
          classes: data.classes || [],
          subjects: data.subjects || [],
          gradingSystem: data.gradingSystem || '',
          termStart: data.termStart || '',
          termEnd: data.termEnd || '',
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };

    fetchSettings();
  }, []);

  // ----- Handle input changes -----
  const handleChange = (e, stateSetter) => {
    const { name, value } = e.target;
    stateSetter(prev => ({ ...prev, [name]: value }));
  };

  // ----- Handle form submission -----
  const handleSubmit = async (section) => {
    setLoading(true);
    setMessage('');
    try {
      let payload;
      let endpoint = '/api/admin/settings';

      if (section === 'profile') payload = profile;
      else if (section === 'security') payload = security;
      else if (section === 'fees') payload = fees;
      else if (section === 'academic') payload = academic;

      const res = await axios.post(endpoint, { section, data: payload });
      setMessage(res.data.message || 'Settings updated successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
      setMessage(err.response?.data?.message || 'Failed to update settings.');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">School Settings</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            Fees
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            Academic
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div>
        {/* ---------- Profile ---------- */}
        {activeTab === 'profile' && (
          <div>
            <div className="mb-3">
              <label className="form-label">School Name</label>
              <input
                type="text"
                className="form-control"
                name="schoolName"
                value={profile.schoolName}
                onChange={(e) => handleChange(e, setProfile)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="schoolEmail"
                value={profile.schoolEmail}
                onChange={(e) => handleChange(e, setProfile)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={profile.phone}
                onChange={(e) => handleChange(e, setProfile)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                name="address"
                value={profile.address}
                onChange={(e) => handleChange(e, setProfile)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Motto / Tagline</label>
              <input
                type="text"
                className="form-control"
                name="motto"
                value={profile.motto}
                onChange={(e) => handleChange(e, setProfile)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit('profile')}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}

        {/* ---------- Security ---------- */}
        {activeTab === 'security' && (
          <div>
            <div className="mb-3">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                name="currentPassword"
                value={security.currentPassword}
                onChange={(e) => handleChange(e, setSecurity)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                name="newPassword"
                value={security.newPassword}
                onChange={(e) => handleChange(e, setSecurity)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={security.confirmPassword}
                onChange={(e) => handleChange(e, setSecurity)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit('security')}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* ---------- Fees ---------- */}
        {activeTab === 'fees' && (
          <div>
            <div className="mb-3">
              <label className="form-label">Default Fee</label>
              <input
                type="number"
                className="form-control"
                name="defaultFee"
                value={fees.defaultFee}
                onChange={(e) => handleChange(e, setFees)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Late Fee</label>
              <input
                type="number"
                className="form-control"
                name="lateFee"
                value={fees.lateFee}
                onChange={(e) => handleChange(e, setFees)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit('fees')}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Fees'}
            </button>
          </div>
        )}

        {/* ---------- Academic ---------- */}
        {activeTab === 'academic' && (
          <div>
            <div className="mb-3">
              <label className="form-label">Grading System</label>
              <input
                type="text"
                className="form-control"
                name="gradingSystem"
                value={academic.gradingSystem}
                onChange={(e) => handleChange(e, setAcademic)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Term Start</label>
              <input
                type="date"
                className="form-control"
                name="termStart"
                value={academic.termStart}
                onChange={(e) => handleChange(e, setAcademic)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Term End</label>
              <input
                type="date"
                className="form-control"
                name="termEnd"
                value={academic.termEnd}
                onChange={(e) => handleChange(e, setAcademic)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit('academic')}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Academic Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
