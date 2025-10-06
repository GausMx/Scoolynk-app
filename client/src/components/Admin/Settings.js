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
        
        // --- DIAGNOSTIC LOGGING ---
        // CHECK YOUR BROWSER CONSOLE for this log. It will show you exactly 
        // what data the frontend received from the backend API.
        console.log('Frontend received settings data:', data);
        // --------------------------

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
          // Term dates are now provided by the backend in YYYY-MM-DD format
          termStart: data.school?.termStart || '',
          termEnd: data.school?.termEnd || '',
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setMessage('Failed to load settings. Check network connection.');
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
      // Determine which state to use for the payload based on the section
      if (section === 'profile') payload = profile;
      if (section === 'security') payload = security;
      if (section === 'fees') payload = fees;
      if (section === 'academic') payload = academic;

      // The frontend sends the section and the corresponding data object
      const res = await axios.put(
        '/api/admin/settings',
        { section, data: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message || 'Settings updated successfully!');
      setEditMode(false);
    } catch (err) {
      console.error('Error updating settings:', err);
      // The backend now provides more specific error messages
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
      {loading && <div className="text-center text-primary">Loading...</div>}
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
                  {/* schoolEmail is always read-only as it's the Admin's email */}
                  {editMode && field !== 'schoolEmail' ? (
                    // EDIT MODE: Show Input Field
                    <input
                      type={field === 'schoolEmail' ? 'email' : 'text'}
                      className="form-control rounded-3"
                      name={field} // Name matches state key
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
            <h5 className="mb-3">Fee Structure</h5>
            {['defaultFee', 'lateFee'].map((field) => (
              <div className="mb-3 row" key={field}>
                <label className="col-sm-3 col-form-label font-weight-bold text-muted">
                  {formatFieldName(field)}:
                </label>
                <div className="col-sm-9">
                    {editMode ? (
                        <input
                            type="number"
                            className="form-control rounded-3"
                            name={field}
                            value={fees[field]}
                            onChange={(e) => handleChange(e, setFees)}
                        />
                    ) : (
                        <p className="form-control-plaintext fw-bold">
                            {fees[field] ? `$${fees[field]}` : 'N/A'}
                        </p>
                    )}
                </div>
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
            <h5 className="mb-3">Academic Term & Grading</h5>
            {/* Simple fields */}
            {['gradingSystem', 'termStart', 'termEnd'].map((field) => (
              <div className="mb-3 row" key={field}>
                <label className="col-sm-3 col-form-label font-weight-bold text-muted">
                    {formatFieldName(field)}:
                </label>
                <div className="col-sm-9">
                    {editMode ? (
                        <input
                            type={field.includes('term') ? 'date' : 'text'}
                            className="form-control rounded-3"
                            name={field}
                            value={academic[field]}
                            onChange={(e) => handleChange(e, setAcademic)}
                        />
                    ) : (
                        <p className="form-control-plaintext fw-bold">
                            {academic[field] || 'N/A'}
                        </p>
                    )}
                </div>
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
