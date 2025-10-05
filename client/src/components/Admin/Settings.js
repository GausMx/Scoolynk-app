// src/components/Admin/Settings.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Spinner, Button, Form } from 'react-bootstrap';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState({
    admin: { name: '', email: '' },
    school: { name: '', address: '', schoolCode: '' },
  });
  const [form, setForm] = useState({
    schoolName: '',
    schoolAddress: '',
    newPassword: '',
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
        setForm({
          schoolName: res.data.school.name || '',
          schoolAddress: res.data.school.address || '',
          newPassword: '',
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit updates
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/admin/settings',
        {
          schoolName: form.schoolName,
          schoolAddress: form.schoolAddress,
          newPassword: form.newPassword || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Settings updated successfully!');
      setEditMode(false);
      // Re-fetch latest data
      const refreshed = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(refreshed.data);
    } catch (err) {
      console.error(err);
      alert('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <main className="container mt-5 mb-5">
      <Card className="shadow-sm p-4 rounded-3">
        <h2 className="mb-4 text-center text-primary">School Settings</h2>

        {/* Admin Info */}
        <section className="mb-4">
          <h5 className="text-secondary mb-3">Admin Information</h5>
          <p><strong>Name:</strong> {data.admin.name}</p>
          <p><strong>Email:</strong> {data.admin.email}</p>
        </section>

        {/* School Info */}
        <section className="mb-4">
          <h5 className="text-secondary mb-3">School Information</h5>
          {!editMode ? (
            <>
              <p><strong>School Name:</strong> {data.school.name}</p>
              <p><strong>Address:</strong> {data.school.address || 'Not set'}</p>
              <p><strong>School Code:</strong> {data.school.schoolCode}</p>
            </>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>School Name</Form.Label>
                <Form.Control
                  type="text"
                  name="schoolName"
                  value={form.schoolName}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>School Address</Form.Label>
                <Form.Control
                  type="text"
                  name="schoolAddress"
                  value={form.schoolAddress}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Change Password (optional)</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </Form.Group>
            </Form>
          )}
        </section>

        {/* Buttons */}
        <div className="d-flex justify-content-end gap-2">
          {!editMode ? (
            <Button variant="primary" onClick={() => setEditMode(true)}>
              Edit Settings
            </Button>
          ) : (
            <>
              <Button
                variant="success"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </Card>
    </main>
  );
};

export default Settings;
