// src/components/Admin/Settings.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Settings as SettingsIcon,
  User, Lock, Eye, EyeOff, Copy, Check,
  Image, Upload, X, Building2
} from 'lucide-react';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a File to a Base64 data-URL string */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const MAX_LOGO_BYTES = 1 * 1024 * 1024; // 1 MB

// ─── Component ────────────────────────────────────────────────────────────────
const Settings = () => {
  const [activeTab,       setActiveTab]       = useState('profile');
  const [loading,         setLoading]         = useState(false);
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [loadingPercent,  setLoadingPercent]  = useState(0);
  const [message,         setMessage]         = useState({ type: '', text: '' });

  // ── Profile ─────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    schoolName: '',
    name:       '',
    email:      '',
    phone:      '',
    motto:      '',
  });

  // ── Branding ────────────────────────────────────────────────────────────────
  const [branding, setBranding] = useState({
    logoBase64:    '',   // stored as data-URL in state; sent to server as-is
    address:       '',
    motto:         '',
    principalName: '',
    email:         '',
    phone:         '',
  });
  const [logoPreview,  setLogoPreview]  = useState('');   // for <img> preview
  const [logoError,    setLogoError]    = useState('');
  const logoInputRef = useRef();

  // ── Security ────────────────────────────────────────────────────────────────
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false,
  });

  // ── School code ─────────────────────────────────────────────────────────────
  const [schoolCode, setSchoolCode] = useState('');
  const [showCode,   setShowCode]   = useState(false);
  const [copied,     setCopied]     = useState(false);

  const token = localStorage.getItem('accessToken');

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSettings();
    fetchSchoolCode();
  }, []);

  const fetchSettings = async () => {
    try {
      setInitialLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLoadingPercent(60);
      const { admin, school } = res.data;

      setProfile({
        schoolName: school.name    || '',
        name:       admin.name     || '',
        email:      admin.email    || '',
        phone:      school.phone   || '',
        motto:      school.motto   || '',
      });

      setBranding({
        logoBase64:    school.logoBase64    || '',
        address:       school.address      || '',
        motto:         school.motto        || '',
        principalName: school.principalName|| '',
        email:         school.email        || '',
        phone:         school.phone        || '',
      });

      if (school.logoBase64) setLogoPreview(school.logoBase64);

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
        headers: { Authorization: `Bearer ${token}` },
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

  // ── Logo upload handler ──────────────────────────────────────────────────────
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be smaller than 1 MB. Please compress or resize the image.');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, etc.).');
      e.target.value = '';
      return;
    }

    const base64 = await fileToBase64(file);
    setLogoPreview(base64);
    setBranding(prev => ({ ...prev, logoBase64: base64 }));
  };

  const removeLogo = () => {
    setLogoPreview('');
    setBranding(prev => ({ ...prev, logoBase64: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // ── Profile save ─────────────────────────────────────────────────────────────
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
            phone:      profile.phone,
            motto:      profile.motto,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Profile updated successfully!');
      await fetchSettings();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ── Branding save ────────────────────────────────────────────────────────────
  const handleBrandingUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/settings`,
        {
          section: 'branding',
          data: {
            logoBase64:    branding.logoBase64,
            address:       branding.address,
            motto:         branding.motto,
            principalName: branding.principalName,
            email:         branding.email,
            phone:         branding.phone,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Branding saved! All new result sheets will use these details.');
      await fetchSettings();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save branding');
    } finally {
      setLoading(false);
    }
  };

  // ── Security save ────────────────────────────────────────────────────────────
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
        { section: 'security', data: security },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Password changed successfully!');
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const copySchoolCode = () => {
    navigator.clipboard.writeText(schoolCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ── Render: Profile tab ──────────────────────────────────────────────────────
  const renderProfileSection = () => (
    <form onSubmit={handleProfileUpdate}>
      <div className="row g-4">

        {/* School Info */}
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
                  onChange={e => setProfile({ ...profile, schoolName: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone Number</label>
                <input
                  type="tel"
                  className="form-control rounded-3"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">School Motto</label>
                <textarea
                  className="form-control rounded-3"
                  rows={2}
                  value={profile.motto}
                  onChange={e => setProfile({ ...profile, motto: e.target.value })}
                  placeholder="Enter your school motto..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Details (read-only) */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-light">
            <h5 className="text-secondary mb-4">
              <User size={20} className="me-2" />
              Administrator Details <small className="text-muted fw-normal">(Read-only)</small>
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">Admin Name</label>
                <input type="text" className="form-control rounded-3 bg-white" value={profile.name} disabled />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">Admin Email</label>
                <input type="email" className="form-control rounded-3 bg-white" value={profile.email} disabled />
              </div>
            </div>
            <small className="text-muted mt-2 d-block">
              <Lock size={14} className="me-1" />
              Admin credentials cannot be changed here
            </small>
          </div>
        </div>

        {/* School Code */}
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
                <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setShowCode(!showCode)}>
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button type="button" className="btn btn-primary rounded-3" onClick={copySchoolCode}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            <div className="alert alert-info rounded-3 mb-0">
              <small>
                <strong>Note:</strong> Share this code with teachers and staff to register.
                Keep it secure and don't share publicly.
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 d-flex justify-content-end">
          <button type="submit" className="btn btn-primary rounded-3 px-4 w-100 w-sm-auto" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );

  // ── Render: Branding tab ─────────────────────────────────────────────────────
  const renderBrandingSection = () => (
    <form onSubmit={handleBrandingUpdate}>
      <div className="row g-4">

        {/* Logo Upload */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
            <h5 className="text-primary mb-1">
              <Image size={20} className="me-2" />
              School Logo
            </h5>
            <p className="text-muted small mb-4">
              This logo will appear on every result sheet. Use a square PNG with transparent background for best results.
            </p>

            {/* Current logo preview */}
            {logoPreview ? (
              <div className="d-flex align-items-start gap-3 mb-3">
                <div
                  style={{
                    width: 110, height: 110, border: '2px dashed #ccc',
                    borderRadius: 8, overflow: 'hidden', backgroundColor: '#f8f9fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <img
                    src={logoPreview}
                    alt="School logo"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <p className="mb-2 small fw-semibold text-success">✓ Logo uploaded</p>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={removeLogo}>
                    <X size={14} className="me-1" />
                    Remove Logo
                  </button>
                  <p className="text-muted mt-2" style={{ fontSize: '11px' }}>
                    Or choose a new file below to replace it
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="border rounded-3 p-4 text-center mb-3"
                style={{ borderStyle: 'dashed !important', backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}
              >
                <Image size={40} className="text-muted mb-2" />
                <p className="text-muted mb-0 small">No logo uploaded yet</p>
              </div>
            )}

            {/* Upload input */}
            <div>
              <label className="form-label fw-semibold small">
                {logoPreview ? 'Replace Logo' : 'Upload Logo'}
              </label>
              <input
                ref={logoInputRef}
                type="file"
                className="form-control rounded-3"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {logoError && (
                <div className="alert alert-danger mt-2 py-2 rounded-3 mb-0">
                  <small>{logoError}</small>
                </div>
              )}
              <small className="text-muted d-block mt-1">
                Max size: 1 MB. PNG with transparent background recommended.
              </small>
            </div>
          </div>
        </div>

        {/* School Identity */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
            <h5 className="text-primary mb-4">
              <Building2 size={20} className="me-2" />
              School Identity
              <small className="text-muted fw-normal d-block mt-1" style={{ fontSize: '13px' }}>
                These details appear on every printed result sheet
              </small>
            </h5>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">School Address *</label>
                <textarea
                  className="form-control rounded-3"
                  rows={2}
                  value={branding.address}
                  onChange={e => setBranding(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 12 School Street, Kaduna, Kaduna State"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">School Motto</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={branding.motto}
                  onChange={e => setBranding(prev => ({ ...prev, motto: e.target.value }))}
                  placeholder="e.g. Excellence in Learning"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Principal / Head Teacher Name</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={branding.principalName}
                  onChange={e => setBranding(prev => ({ ...prev, principalName: e.target.value }))}
                  placeholder="e.g. Alhaji Musa Ibrahim"
                />
                <small className="text-muted">Shown on result signature line</small>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">School Email</label>
                <input
                  type="email"
                  className="form-control rounded-3"
                  value={branding.email}
                  onChange={e => setBranding(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="school@example.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">School Phone</label>
                <input
                  type="tel"
                  className="form-control rounded-3"
                  value={branding.phone}
                  onChange={e => setBranding(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview strip */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ backgroundColor: '#fffbf0' }}>
            <p className="fw-semibold mb-2 small">
              📄 Result Sheet Header Preview
            </p>
            <div
              className="border rounded p-2 bg-white d-flex align-items-center gap-3"
              style={{ minHeight: 70 }}
            >
              {/* Logo slot */}
              <div
                style={{
                  width: 56, height: 56, border: '1px dashed #ccc',
                  borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <small className="text-muted" style={{ fontSize: 9 }}>LOGO</small>
                }
              </div>
              {/* School info */}
              <div className="text-center flex-grow-1">
                <div className="fw-bold" style={{ fontSize: 13 }}>
                  {profile.schoolName ? profile.schoolName.toUpperCase() : 'SCHOOL NAME'}
                </div>
                {branding.motto && (
                  <div className="fst-italic text-muted" style={{ fontSize: 10 }}>
                    Motto: {branding.motto}
                  </div>
                )}
                {branding.address && (
                  <div className="text-muted" style={{ fontSize: 10 }}>{branding.address}</div>
                )}
                {(branding.phone || branding.email) && (
                  <div className="text-muted" style={{ fontSize: 9 }}>
                    {[branding.phone && `Tel: ${branding.phone}`, branding.email && `Email: ${branding.email}`]
                      .filter(Boolean).join(' | ')}
                  </div>
                )}
              </div>
              {/* Passport slot */}
              <div
                style={{
                  width: 48, height: 56, border: '1px dashed #ccc',
                  borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <small className="text-muted" style={{ fontSize: 8, textAlign: 'center', lineHeight: 1.2 }}>
                  Passport<br/>Photo
                </small>
              </div>
            </div>
            <small className="text-muted mt-2 d-block">
              ↑ Approximate appearance on the result sheet header. School name comes from the Profile tab.
            </small>
          </div>
        </div>

        <div className="col-12 d-flex justify-content-end">
          <button type="submit" className="btn btn-success rounded-3 px-4 w-100 w-sm-auto" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
              : <><Upload size={16} className="me-2" />Save Branding</>
            }
          </button>
        </div>
      </div>
    </form>
  );

  // ── Render: Security tab ─────────────────────────────────────────────────────
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
                  <li>Avoid easily guessable passwords</li>
                </ul>
              </small>
            </div>

            {[
              { field: 'current', label: 'Current Password', key: 'currentPassword' },
              { field: 'new',     label: 'New Password',     key: 'newPassword' },
              { field: 'confirm', label: 'Confirm New Password', key: 'confirmPassword' },
            ].map(({ field, label, key }) => (
              <div className="mb-3" key={key}>
                <label className="form-label fw-semibold">{label} *</label>
                <div className="input-group">
                  <input
                    type={showPasswords[field] ? 'text' : 'password'}
                    className="form-control rounded-start-3"
                    value={security[key]}
                    onChange={e => setSecurity(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-end-3"
                    onClick={() => togglePasswordVisibility(field)}
                  >
                    {showPasswords[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {key === 'confirmPassword' && security.confirmPassword && security.newPassword !== security.confirmPassword && (
                  <small className="text-danger">Passwords do not match</small>
                )}
              </div>
            ))}

            <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                onClick={() => {
                  setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-3 px-4"
                disabled={
                  loading ||
                  security.newPassword !== security.confirmPassword ||
                  security.newPassword.length < 6
                }
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Updating...</>
                  : 'Change Password'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      {initialLoading ? (
        <Loading percentage={loadingPercent} />
      ) : (
        <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>

          <div className="mb-4">
            <h2 className="fw-bold text-primary d-flex align-items-center fs-4">
              <SettingsIcon size={28} className="me-2" />
              Settings
            </h2>
            <p className="text-muted small">Manage your school configuration and preferences</p>
          </div>

          {message.text && (
            <div
              className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3 alert-dismissible fade show`}
              role="alert"
            >
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })} />
            </div>
          )}

          {/* Tabs */}
          <ul className="nav nav-pills mb-4 gap-2 flex-column flex-md-row">
            {[
              { key: 'profile',  icon: <User   size={16} className="me-2" />, label: 'Profile'  },
              { key: 'branding', icon: <Image  size={16} className="me-2" />, label: 'Branding & Logo' },
              { key: 'security', icon: <Lock   size={16} className="me-2" />, label: 'Security' },
            ].map(tab => (
              <li key={tab.key} className="nav-item w-100 w-md-auto">
                <button
                  className={`nav-link rounded-3 w-100 d-flex align-items-center justify-content-center ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon}{tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="tab-content">
            {activeTab === 'profile'  && renderProfileSection()}
            {activeTab === 'branding' && renderBrandingSection()}
            {activeTab === 'security' && renderSecuritySection()}
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;