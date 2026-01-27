// src/components/Admin/Settings.js - PAYMENT CODE REMOVED

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, User, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile state
  const [profile, setProfile] = useState({
    schoolName: '',
    name: '',
    email: '',
    phone: '',
    motto: ''
  });

  // Security state with visibility toggles
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // School code state
  const [schoolCode, setSchoolCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('accessToken');

  // Fetch settings
  useEffect(() => {
    fetchSettings();
    fetchSchoolCode();
  }, []);

  const fetchSettings = async () => {
    try {
      setInitialLoading(true);
      setLoadingPercent(10);
      
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoadingPercent(50);

      const { admin, school } = res.data;
      
      setProfile({
        schoolName: school.name || '',
        name: admin.name || '',
        email: admin.email || '',
        phone: school.phone || '',
        motto: school.motto || ''
      });
      
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      showMessage('error', 'Failed to load settings');
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setInitialLoading(false), 300);
    }
  };

  const fetchSchoolCode = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/school/code`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchoolCode(res.data.schoolCode || '');
    } catch (err) {
      console.error('Failed to fetch school code:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/settings`,
        {
          section: 'profile',
          data: {
            schoolName: profile.schoolName,
            phone: profile.phone,
            motto: profile.motto
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Profile updated successfully!');
      await fetchSettings();
    } catch (err) {
      console.error('Failed to update profile:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle security update
  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    
    if (security.newPassword !== security.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (security.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/settings`,
        {
          section: 'security',
          data: security
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Password changed successfully!');
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to update password:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Copy school code
  const copySchoolCode = () => {
    navigator.clipboard.writeText(schoolCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  // Profile Section
  const renderProfileSection = () => (
    <form onSubmit={handleProfileUpdate}>
      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
            <h5 className="text-primary mb-4">
              <User size={20} className="me-2" />
              School Information
            </h5>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">School Name *</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={profile.schoolName}
                  onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })}
                  required
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone Number *</label>
                <input
                  type="tel"
                  className="form-control rounded-3"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">School Motto</label>
                <textarea
                  className="form-control rounded-3"
                  rows="2"
                  value={profile.motto}
                  onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                  placeholder="Enter your school motto..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-light">
            <h5 className="text-secondary mb-4">
              <User size={20} className="me-2" />
              Administrator Details (Read-only)
            </h5>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">Admin Name</label>
                <input
                  type="text"
                  className="form-control rounded-3 bg-white"
                  value={profile.name}
                  disabled
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">Admin Email</label>
                <input
                  type="email"
                  className="form-control rounded-3 bg-white"
                  value={profile.email}
                  disabled
                />
              </div>
            </div>
            <small className="text-muted mt-2">
              <Lock size={14} className="me-1" />
              Admin credentials cannot be changed from settings
            </small>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 border-start border-primary border-5">
            <h5 className="text-primary mb-3">
              <Lock size={20} className="me-2" />
              School Registration Code
            </h5>
            
            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 mb-3">
              <input
                type={showCode ? 'text' : 'password'}
                className="form-control rounded-3 bg-light"
                value={schoolCode}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}
              />
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3 flex-fill flex-sm-grow-0"
                  onClick={() => setShowCode(!showCode)}
                  title={showCode ? 'Hide code' : 'Show code'}
                >
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-3 flex-fill flex-sm-grow-0"
                  onClick={copySchoolCode}
                  title="Copy code"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            
            <div className="alert alert-info rounded-3 mb-0">
              <small>
                <strong>Note:</strong> Share this code with teachers and staff to register in your school. 
                Keep it secure and don't share publicly.
              </small>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary rounded-3 px-4 w-100 w-sm-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  // Security Section
  const renderSecuritySection = () => (
    <form onSubmit={handleSecurityUpdate}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
            <h5 className="text-primary mb-4">
              <Lock size={20} className="me-2" />
              Change Password
            </h5>

            <div className="alert alert-warning rounded-3 mb-4">
              <small>
                <strong>Password Requirements:</strong>
                <ul className="mb-0 mt-2">
                  <li>At least 6 characters long</li>
                  <li>Mix of letters and numbers recommended</li>
                  <li>Avoid using easily guessable passwords</li>
                </ul>
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Current Password *</label>
              <div className="input-group">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  className="form-control rounded-start-3"
                  value={security.currentPassword}
                  onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-end-3"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">New Password *</label>
              <div className="input-group">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  className="form-control rounded-start-3"
                  value={security.newPassword}
                  onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-end-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {security.newPassword && security.newPassword.length < 6 && (
                <small className="text-danger">Password must be at least 6 characters</small>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Confirm New Password *</label>
              <div className="input-group">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  className="form-control rounded-start-3"
                  value={security.confirmPassword}
                  onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-end-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {security.confirmPassword && security.newPassword !== security.confirmPassword && (
                <small className="text-danger">Passwords do not match</small>
              )}
            </div>

            <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 w-100 w-sm-auto"
                onClick={() => {
                  setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-3 px-4 w-100 w-sm-auto"
                disabled={loading || security.newPassword !== security.confirmPassword || security.newPassword.length < 6}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <>
      {initialLoading ? (
        <Loading percentage={loadingPercent} />
      ) : (
        <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
          <div className="mb-4">
            <h2 className="fw-bold text-primary d-flex align-items-center fs-4 fs-md-3">
              <SettingsIcon size={32} className="me-2" />
              Settings
            </h2>
            <p className="text-muted small">Manage your school configuration and preferences</p>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3 alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
            </div>
          )}

          <ul className="nav nav-pills mb-4 gap-2 flex-column flex-md-row">
            <li className="nav-item w-100 w-md-auto">
              <button
                className={`nav-link rounded-3 w-100 ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} className="me-2" />
                Profile
              </button>
            </li>
            <li className="nav-item w-100 w-md-auto">
              <button
                className={`nav-link rounded-3 w-100 ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Lock size={18} className="me-2" />
                Security
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {activeTab === 'profile' && renderProfileSection()}
            {activeTab === 'security' && renderSecuritySection()}
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;