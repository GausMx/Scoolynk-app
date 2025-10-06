import React, { useState, useEffect, useCallback } from 'react';
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

  // NEW: State to hold the original (last saved) profile values for reset on cancel
  const [originalProfile, setOriginalProfile] = useState({}); 

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

  // Function to fetch settings, wrapped in useCallback to be dependency-friendly
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      
      // --- DIAGNOSTIC LOGGING ---
      // CHECK YOUR BROWSER CONSOLE for this log. This is the definitive check 
      // to see if the backend (Render) is sending the school name/address.
      console.log('Frontend received settings data:', data);
      // --------------------------

      const fetchedProfile = {
        schoolName: data.school?.name || '',
        schoolEmail: data.admin?.email || '',
        phone: data.school?.phone || '',
        address: data.school?.address || '',
        motto: data.school?.motto || '',
      };
      
      // Set both the current and the original state with the fetched data
      setProfile(fetchedProfile);
      setOriginalProfile(fetchedProfile); 
      
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
      setMessage('Failed to load settings. Check network connection.');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies because it doesn't rely on outside state/props

  // ----- Fetch existing settings on mount -----
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]); // Run once on mount and when fetchSettings changes (though it won't due to useCallback)

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
      
      // If the profile section was saved, refresh the data to update the original state
      if (section === 'profile' || section === 'fees' || section === 'academic') {
          await fetchSettings();
      }

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
  
  // Logic for resetting profile state on Cancel
  const handleCancelProfileEdit = () => {
    setProfile(originalProfile); // Reset profile state to the last saved values
    setEditMode(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">School Settings</h2>
      {loading && <div className="text-center text-primary">Loading...</div>}
      {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`}>{message}</div>}

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
                    // VIEW MODE: Show Plain Text (Uses profile[field] which is updated by fetchSettings)
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
                  onClick={handleCancelProfileEdit} // Use the new reset handler
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
