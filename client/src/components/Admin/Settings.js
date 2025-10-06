import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Assuming API is correctly configured elsewhere if using fetch
// For this single file, we keep using axios as specified

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  // ----- Fetch existing settings -----
  useEffect(() => {
    // NOTE: This uses localStorage, which is generally discouraged for authentication in production.
    // It's recommended to use secure, HttpOnly cookies for tokens.
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;
        setProfile({
          schoolName: data.school?.name || '',
          schoolEmail: data.admin?.email || '',
          phone: data.school?.phone || '',
          address: data.school?.address || '',
          motto: data.school?.motto || '',
        });
        setFees({
          defaultFee: data.school?.defaultFee || '',
          lateFee: data.school?.lateFee || '',
        });
        setAcademic({
          classes: data.school?.classes || [],
          subjects: data.school?.subjects || [],
          gradingSystem: data.school?.gradingSystem || '',
          termStart: data.school?.termStart || '',
          termEnd: data.school?.termEnd || '',
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ----- Handle input changes -----
  const handleChange = (e, stateSetter) => {
    const { name, value } = e.target;
    stateSetter((prev) => ({ ...prev, [name]: value }));
  };

  // ----- Save updates -----
  const handleSave = async (section) => {
    try {
      setLoading(true);
      setMessage('');
      const token = localStorage.getItem('token');

      let payload = {};
      if (section === 'profile') payload = profile;
      if (section === 'security') payload = security;
      if (section === 'fees') payload = fees;
      if (section === 'academic') payload = academic;

      const res = await axios.put(
        '/api/admin/settings',
        { section, data: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message || 'Settings updated successfully!');
      setEditMode(false);
    } catch (err) {
      console.error('Error updating settings:', err);
      setMessage(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format field name for display
  const formatFieldName = (field) => {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">School Settings</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {['profile', 'security', 'fees', 'academic'].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setEditMode(false); // Reset edit mode when switching tabs
              }}
            >
              {formatFieldName(tab)}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="card p-4 shadow-sm">
        {/* ---------- Profile ---------- */}
        {activeTab === 'profile' && (
          <div>
            {['schoolName', 'schoolEmail', 'phone', 'address', 'motto'].map((field) => (
              <div className="mb-3 row" key={field}>
                <label className="col-sm-3 col-form-label font-weight-bold text-muted">
                  {formatFieldName(field)}:
                </label>
                <div className="col-sm-9">
                  {editMode ? (
                    // EDIT MODE: Show Input Field
                    <input
                      type={field === 'schoolEmail' ? 'email' : 'text'}
                      className="form-control rounded-3"
                      name={field}
                      value={profile[field]}
                      onChange={(e) => handleChange(e, setProfile)}
                    />
                  ) : (
                    // VIEW MODE: Show Plain Text
                    <p className="form-control-plaintext fw-bold">
                      {profile[field] || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {!editMode ? (
              <button className="btn btn-outline-primary rounded-3" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary rounded-3 me-2"
                  onClick={() => handleSave('profile')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary rounded-3" 
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* ---------- Security ---------- */}
        {activeTab === 'security' && (
          <div>
            <h5 className="mb-3">Change Administrator Password</h5>
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {formatFieldName(field)}
                </label>
                <input
                  type="password"
                  className="form-control rounded-3"
                  name={field}
                  value={security[field]}
                  onChange={(e) => handleChange(e, setSecurity)}
                />
              </div>
            ))}
            <button
              className="btn btn-primary rounded-3"
              onClick={() => handleSave('security')}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* ---------- Fees ---------- */}
        {activeTab === 'fees' && (
          <div>
            {['defaultFee', 'lateFee'].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {formatFieldName(field)}
                </label>
                <input
                  type="number"
                  className="form-control rounded-3"
                  name={field}
                  value={fees[field]}
                  onChange={(e) => handleChange(e, setFees)}
                  readOnly={!editMode}
                />
              </div>
            ))}
            {!editMode ? (
              <button className="btn btn-outline-primary rounded-3" onClick={() => setEditMode(true)}>
                Edit Fees
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary rounded-3 me-2"
                  onClick={() => handleSave('fees')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary rounded-3" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* ---------- Academic ---------- */}
        {activeTab === 'academic' && (
          <div>
            {/* Simple fields */}
            {['gradingSystem', 'termStart', 'termEnd'].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {formatFieldName(field)}
                </label>
                <input
                  type={field.includes('term') ? 'date' : 'text'}
                  className="form-control rounded-3"
                  name={field}
                  value={academic[field]}
                  onChange={(e) => handleChange(e, setAcademic)}
                  readOnly={!editMode}
                />
              </div>
            ))}
            {/* TODO: Add complex fields like classes/subjects editor here */}

            {!editMode ? (
              <button className="btn btn-outline-primary rounded-3" onClick={() => setEditMode(true)}>
                Edit Academic Settings
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary rounded-3 me-2"
                  onClick={() => handleSave('academic')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary rounded-3" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
