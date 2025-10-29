// src/components/Admin/Settings.js - COMPLETE FINAL VERSION

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, User, Lock, CreditCard, Eye, EyeOff, Copy, Check, Send, Users, DollarSign } from 'lucide-react';

// Import the payment link modal
import SendPaymentLinkModal from './SendPaymentLinkModal';

const { REACT_APP_API_URL } = process.env;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
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

  // Fees state
  const [fees, setFees] = useState({
    defaultFee: 0
  });

  // Payment tracking state
  const [payments, setPayments] = useState({
    paid: [],
    partial: [],
    unpaid: []
  });
  const [sendingMessages, setSendingMessages] = useState(false);

  // State for payment link modal
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  // School code state
  const [schoolCode, setSchoolCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch settings
  useEffect(() => {
    fetchSettings();
    fetchSchoolCode();
    if (activeTab === 'payments') {
      fetchPaymentData();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { admin, school } = res.data;
      
      setProfile({
        schoolName: school.name || '',
        name: admin.name || '',
        email: admin.email || '',
        phone: school.phone || '',
        motto: school.motto || ''
      });

      setFees({
        defaultFee: school.defaultFee || 0
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
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

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/payments/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
      showMessage('error', 'Failed to load payment data');
    } finally {
      setLoading(false);
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

  // Handle fees update
  const handleFeesUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/settings`,
        {
          section: 'fees',
          data: fees
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', 'Fee settings updated successfully!');
      await fetchSettings();
    } catch (err) {
      console.error('Failed to update fees:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update fees');
    } finally {
      setLoading(false);
    }
  };

  // Send payment reminders
  const sendPaymentReminders = async (category) => {
    try {
      setSendingMessages(true);
      await axios.post(
        `${REACT_APP_API_URL}/api/admin/payments/send-reminders`,
        { category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', `Payment reminders sent to ${category} parents!`);
    } catch (err) {
      console.error('Failed to send reminders:', err);
      showMessage('error', err.response?.data?.message || 'Failed to send reminders');
    } finally {
      setSendingMessages(false);
    }
  };

  // Handle sending payment link to individual student
  const handleSendPaymentLink = (student) => {
    setSelectedStudentForPayment(student);
  };

  // Handle payment link modal close
  const handlePaymentModalClose = () => {
    setSelectedStudentForPayment(null);
  };

  // Handle payment link success
  const handlePaymentLinkSuccess = () => {
    fetchPaymentData();
    setSelectedStudentForPayment(null);
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
          <div className="card border-0 shadow-sm rounded-4 p-4">
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
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
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
          <div className="card border-0 shadow-sm rounded-4 p-4 border-start border-primary border-5">
            <h5 className="text-primary mb-3">
              <Lock size={20} className="me-2" />
              School Registration Code
            </h5>
            
            <div className="d-flex align-items-center gap-2 mb-3">
              <input
                type={showCode ? 'text' : 'password'}
                className="form-control rounded-3 bg-light"
                value={schoolCode}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                onClick={() => setShowCode(!showCode)}
                title={showCode ? 'Hide code' : 'Show code'}
              >
                {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-3"
                onClick={copySchoolCode}
                title="Copy code"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
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
              className="btn btn-primary rounded-3 px-4"
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
          <div className="card border-0 shadow-sm rounded-4 p-4">
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

            <div className="d-flex justify-content-end gap-2">
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

  // Fees Section
  const renderFeesSection = () => (
    <form onSubmit={handleFeesUpdate}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="text-primary mb-4">
              <CreditCard size={20} className="me-2" />
              Default Fee Structure
            </h5>

            <div className="alert alert-info rounded-3 mb-4">
              <small>
                This is the default fee applied to all classes. Individual class fees can be customized in the Manage Classes section.
              </small>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Default Class Fee (₦) *</label>
              <input
                type="number"
                className="form-control rounded-3 form-control-lg"
                value={fees.defaultFee}
                onChange={(e) => setFees({ defaultFee: parseFloat(e.target.value) || 0 })}
                min="0"
                step="1000"
                placeholder="Enter default fee"
                required
              />
              <small className="text-muted">Standard fee amount for all classes</small>
            </div>

            <div className="card bg-light border-0 p-4">
              <div className="text-center">
                <p className="mb-2 text-muted">Current Default Fee</p>
                <h2 className="fw-bold text-primary mb-0">₦{fees.defaultFee.toLocaleString()}</h2>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="submit"
                className="btn btn-primary rounded-3 px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Fee Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  // Payments Section WITH BULK SEND FEATURE
  const renderPaymentsSection = () => {
    
    // NEW: Send bulk payment links to ALL students with balance
    const sendBulkPaymentLinks = async () => {
      if (!window.confirm('Send payment links to ALL students with outstanding balance? This may take a few minutes.')) {
        return;
      }

      try {
        setSendingMessages(true);
        const res = await axios.post(
          `${REACT_APP_API_URL}/api/payments/send-bulk`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        showMessage('success', res.data.message);
        fetchPaymentData();
      } catch (err) {
        showMessage('error', err.response?.data?.message || 'Failed to send bulk payment links');
      } finally {
        setSendingMessages(false);
      }
    };

    const renderStudentList = (students, title, badgeClass, category) => (
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            <span className={`badge ${badgeClass} me-2`}>{students.length}</span>
            {title}
          </h5>
          {students.length > 0 && (
            <button
              className="btn btn-sm btn-success rounded-3"
              onClick={() => sendPaymentReminders(category)}
              disabled={sendingMessages}
            >
              <Send size={16} className="me-1" />
              {sendingMessages ? 'Sending...' : 'Send Bulk Reminders'}
            </button>
          )}
        </div>

        {students.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Parent Phone</th>
                  <th>Fee</th>
                  <th>Amount Paid</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const balance = (student.classFee || 0) - (student.amountPaid || 0);
                  
                  return (
                    <tr key={student._id}>
                      <td className="fw-semibold">{student.name}</td>
                      <td>
                        <span className="badge bg-info text-dark">{student.classId?.name}</span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {student.parentPhone || 'Not provided'}
                        </small>
                      </td>
                      <td>₦{student.classFee?.toLocaleString()}</td>
                      <td>
                        <span className={student.amountPaid > 0 ? 'text-success' : 'text-muted'}>
                          ₦{student.amountPaid?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-primary rounded-3"
                          onClick={() => handleSendPaymentLink(student)}
                          disabled={balance <= 0}
                          title={balance > 0 ? 'Send payment link' : 'No outstanding balance'}
                        >
                          <Send size={14} className="me-1" />
                          Send Link
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-info mb-0">
            No students in this category.
          </div>
        )}
      </div>
    );

    return (
      <div>
        {/* NEW: Bulk Send Payment Links Banner */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="card-body p-4 text-white">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="mb-2">
                  <Send size={24} className="me-2" />
                  Send Payment Links to All Students
                </h5>
                <p className="mb-0 opacity-75">
                  Send payment links via SMS to ALL students with outstanding balance. 
                  Links remain valid until payment is completed (no expiry).
                </p>
              </div>
              <div className="col-md-4 text-end">
                <button
                  className="btn btn-light btn-lg rounded-3 px-4"
                  onClick={sendBulkPaymentLinks}
                  disabled={sendingMessages}
                >
                  {sendingMessages ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="me-2" />
                      Send All Links
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card bg-success text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Paid in Full</h6>
                  <h3 className="mb-0">{payments.paid.length}</h3>
                </div>
                <Check size={40} />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-warning text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Partial Payment</h6>
                  <h3 className="mb-0">{payments.partial.length}</h3>
                </div>
                <DollarSign size={40} />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-danger text-white shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Not Paid</h6>
                  <h3 className="mb-0">{payments.unpaid.length}</h3>
                </div>
                <Users size={40} />
              </div>
            </div>
          </div>
        </div>

        {/* Student Lists */}
        {renderStudentList(payments.paid, 'Paid in Full', 'bg-success', 'paid')}
        {renderStudentList(payments.partial, 'Partial Payment', 'bg-warning', 'partial')}
        {renderStudentList(payments.unpaid, 'Not Paid', 'bg-danger', 'unpaid')}
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-primary d-flex align-items-center">
          <SettingsIcon size={32} className="me-2" />
          Settings
        </h2>
        <p className="text-muted">Manage your school configuration and preferences</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3 alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link rounded-3 ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} className="me-2" />
            Profile
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-3 ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} className="me-2" />
            Security
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-3 ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            <CreditCard size={18} className="me-2" />
            Fees
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-3 ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <DollarSign size={18} className="me-2" />
            Payments
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {activeTab === 'profile' && renderProfileSection()}
        {activeTab === 'security' && renderSecuritySection()}
        {activeTab === 'fees' && renderFeesSection()}
        {activeTab === 'payments' && renderPaymentsSection()}
      </div>

      {selectedStudentForPayment && (
        <SendPaymentLinkModal
          student={selectedStudentForPayment}
          onClose={handlePaymentModalClose}
          onSuccess={handlePaymentLinkSuccess}
        />
      )}
    </div>
  );
};

export default Settings;