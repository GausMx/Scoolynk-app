import React, { useState } from 'react';
import { getToken } from '../utils/auth';
import api from '../utils/api';
import '../common/Layout.css';

const Settings = () => {
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/change-password', { password }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setMessage(res.data.message);
      setPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error changing password');
    }
  };

  const handleEditSchool = async e => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/edit-school', { name: schoolName }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setMessage(res.data.message);
      setSchoolName('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating school info');
    }
  };

  return (
    <div className="container">
      <h2>Settings</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleChangePassword} className="mb-4">
        <h4>Change Password</h4>
        <input type="password" className="form-control mb-2" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn btn-primary">Update Password</button>
      </form>
      <form onSubmit={handleEditSchool}>
        <h4>Edit School Info</h4>
        <input type="text" className="form-control mb-2" placeholder="School Name" value={schoolName} onChange={e => setSchoolName(e.target.value)} required />
        <button type="submit" className="btn btn-secondary">Update School</button>
      </form>
    </div>
  );
};

export default Settings;
