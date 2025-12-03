// src/components/Admin/Settings.js - WITH MOBILE RESPONSIVE PAYMENT TAB USING BOOTSTRAP CLASSES

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, User, Lock, Eye, EyeOff, Copy, Check, Send, Users, DollarSign, AlertTriangle, ExternalLink } from 'lucide-react';

// Import the payment link modal
import SendPaymentLinkModal from './SendPaymentLinkModal';
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

  // Payment tracking state
  const [payments, setPayments] = useState({
    paid: [],
    partial: [],
    unpaid: []
  });
  const [sendingMessages, setSendingMessages] = useState(false);

  // State for payment link modal
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  // SMS error state
  const [smsError, setSmsError] = useState({ error: '', errorCode: '' });

  // School code state
  const [schoolCode, setSchoolCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('accessToken');

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

  // Send payment reminders
  const sendPaymentReminders = async (category) => {
    try {
      setSendingMessages(true);
      setSmsError({ error: '', errorCode: '' }); // Clear previous errors
      
      await axios.post(
        `${REACT_APP_API_URL}/api/admin/payments/send-reminders`,
        { category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('success', `Payment reminders sent to ${category} parents!`);
    } catch (err) {
      console.error('Failed to send reminders:', err);
      const errorData = err.response?.data;
      
      showMessage('error', errorData?.message || 'Failed to send reminders');
      
      // Store SMS error details
      if (errorData?.errorCode) {
        setSmsError({ 
          error: errorData.message, 
          errorCode: errorData.errorCode 
        });
      }
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
      {/* Profile form code unchanged */}
      {/* ... */}
    </form>
  );

  // Security Section
  const renderSecuritySection = () => (
    <form onSubmit={handleSecurityUpdate}>
      {/* Security form code unchanged */}
      {/* ... */}
    </form>
  );

  // Payments Section WITH MOBILE RESPONSIVE BOOTSTRAP CLASSES
  const renderPaymentsSection = () => {
    
    // SMS Balance Warning Component
    const SMSBalanceWarning = () => {
      if (!smsError.error || smsError.errorCode !== 'INSUFFICIENT_BALANCE') return null;

      return (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4">
          <div className="d-flex align-items-start">
            <AlertTriangle size={24} className="text-warning me-3 mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <h5 className="alert-heading mb-2">SMS Service Needs Attention</h5>
              <p className="mb-3">{smsError.error}</p>
              
              <div className="bg-light rounded-3 p-3 mb-3">
                <h6 className="mb-2">How to Top Up Your SMS Balance:</h6>
                <ol className="mb-0 ps-3 small">
                  <li>Go to <a href="https://termii.com" target="_blank" rel="noopener noreferrer" className="fw-semibold">Termii.com <ExternalLink size={14} className="ms-1" /></a></li>
                  <li>Log in to your account</li>
                  <li>Navigate to "Wallet" or "Top Up"</li>
                  <li>Add credits to your account</li>
                  <li>Return here and try sending SMS again</li>
                </ol>
              </div>

              <div className="alert alert-info mb-0">
                <small>
                  <strong>Tip:</strong> Each SMS costs approximately ₦2-4. We recommend maintaining a balance 
                  of at least ₦10,000 for smooth operations.
                </small>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    // NEW: Send bulk payment links to ALL students with balance
    const sendBulkPaymentLinks = async () => {
      if (!window.confirm('Send payment links to ALL students with outstanding balance? This may take a few minutes.')) {
        return;
      }

      try {
        setSendingMessages(true);
        setSmsError({ error: '', errorCode: '' }); // Clear previous errors
        
        const res = await axios.post(
          `${REACT_APP_API_URL}/api/payments/send-bulk`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        showMessage('success', res.data.message);
        fetchPaymentData();
      } catch (err) {
        console.error('Failed to send bulk payment links:', err);
        const errorData = err.response?.data;
        
        showMessage('error', errorData?.message || 'Failed to send bulk payment links');
        
        // Store SMS error details
        if (errorData?.errorCode) {
          setSmsError({ 
            error: errorData.message, 
            errorCode: errorData.errorCode 
          });
        }
      } finally {
        setSendingMessages(false);
      }
    };

    // Render student list with responsive table and Bootstrap classes
    const renderStudentList = (students, title, badgeClass, category) => (
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
          <h5 className="mb-3 mb-md-0">
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
        {/* SMS Balance Warning */}
        <SMSBalanceWarning />
        
        {/* Bulk Send Payment Links Banner */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="card-body p-4 text-white">
            <div className="row align-items-center">
              <div className="col-12 col-md-8 mb-3 mb-md-0">
                <h5 className="mb-2 d-flex align-items-center gap-2">
                  <Send size={24} />
                  Send Payment Links to All Students
                </h5>
                <p className="mb-0 opacity-75">
                  Send payment links via SMS to ALL students with outstanding balance. 
                  Links remain valid until payment is completed (no expiry).
                </p>
              </div>
              <div className="col-12 col-md-4 text-md-end">
                <button
                  className="btn btn-light btn-lg rounded-3 px-4 w-100 w-md-auto"
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
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-4">
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
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 w-100 w-md-auto ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} className="me-2" />
                Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 w-100 w-md-auto ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Lock size={18} className="me-2" />
                Security
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 w-100 w-md-auto ${activeTab === 'payments' ? 'active' : ''}`}
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
      )}
    </>
  );
};

export default Settings;