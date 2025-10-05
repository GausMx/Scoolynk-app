import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
                setEditMode(false);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div>
        {/* ---------- Profile ---------- */}
        {activeTab === 'profile' && (
          <div>
            {['schoolName', 'schoolEmail', 'phone', 'address', 'motto'].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type={field === 'schoolEmail' ? 'email' : 'text'}
                  className="form-control"
                  name={field}
                  value={profile[field]}
                  onChange={(e) => handleChange(e, setProfile)}
                  readOnly={!editMode}
                />
              </div>
            ))}
            {!editMode ? (
              <button className="btn btn-outline-primary" onClick={() => setEditMode(true)}>
                Edit
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => handleSave('profile')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* ---------- Security ---------- */}
        {activeTab === 'security' && (
          <div>
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type="password"
                  className="form-control"
                  name={field}
                  value={security[field]}
                  onChange={(e) => handleChange(e, setSecurity)}
                />
              </div>
            ))}
            <button
              className="btn btn-primary"
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
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type="number"
                  className="form-control"
                  name={field}
                  value={fees[field]}
                  onChange={(e) => handleChange(e, setFees)}
                  readOnly={!editMode}
                />
              </div>
            ))}
            {!editMode ? (
              <button className="btn btn-outline-primary" onClick={() => setEditMode(true)}>
                Edit
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => handleSave('fees')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* ---------- Academic ---------- */}
        {activeTab === 'academic' && (
          <div>
            {['gradingSystem', 'termStart', 'termEnd'].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type={field.includes('term') ? 'date' : 'text'}
                  className="form-control"
                  name={field}
                  value={academic[field]}
                  onChange={(e) => handleChange(e, setAcademic)}
                  readOnly={!editMode}
                />
              </div>
            ))}
            {!editMode ? (
              <button className="btn btn-outline-primary" onClick={() => setEditMode(true)}>
                Edit
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => handleSave('academic')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
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
