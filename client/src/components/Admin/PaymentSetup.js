// src/components/Admin/PaymentSetup.js - WITH LOADING ANIMATION

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Check, AlertCircle } from 'lucide-react';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const PaymentSetup = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [banks, setBanks] = useState([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      setLoadingPercent(10);

      // Fetch banks
      const banksRes = await axios.get(`${REACT_APP_API_URL}/api/subaccount/banks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanks(banksRes.data.banks);
      
      setLoadingPercent(50);

      // Check configuration
      const configRes = await axios.get(`${REACT_APP_API_URL}/api/subaccount/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsConfigured(configRes.data.isConfigured);
      setConfig(configRes.data);
      
      if (configRes.data.isConfigured && configRes.data.bankDetails) {
        setFormData({
          accountNumber: configRes.data.bankDetails.accountNumber || '',
          accountName: configRes.data.bankDetails.accountName || '',
          bankCode: configRes.data.bankDetails.bankCode || '',
          bankName: configRes.data.bankDetails.bankName || ''
        });
      }

      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setLoadingPercent(100);
    } finally {
      setTimeout(() => setInitialLoading(false), 300);
    }
  };

  const checkConfiguration = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/subaccount/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsConfigured(res.data.isConfigured);
      setConfig(res.data);
      
      if (res.data.isConfigured && res.data.bankDetails) {
        setFormData({
          accountNumber: res.data.bankDetails.accountNumber || '',
          accountName: res.data.bankDetails.accountName || '',
          bankCode: res.data.bankDetails.bankCode || '',
          bankName: res.data.bankDetails.bankName || ''
        });
      }
    } catch (err) {
      console.error('Failed to check configuration:', err);
    }
  };

  const verifyAccount = async () => {
    if (!formData.accountNumber || !formData.bankCode) {
      showMessage('error', 'Please select bank and enter account number');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/subaccount/verify-account`,
        { accountNumber: formData.accountNumber, bankCode: formData.bankCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFormData({ ...formData, accountName: res.data.accountName });
      showMessage('success', `Account verified: ${res.data.accountName}`);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.accountName) {
      showMessage('error', 'Please verify account first');
      return;
    }

    try {
      setLoading(true);
      const endpoint = isConfigured ? '/api/subaccount/update' : '/api/subaccount/create';
      
      const res = await axios.post(
        `${REACT_APP_API_URL}${endpoint}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showMessage('success', res.data.message);
      checkConfiguration();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Configuration failed');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (initialLoading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      <div className="mb-4">
        <h2 className="fw-bold text-primary d-flex align-items-center fs-4 fs-md-3">
          <Building size={28} className="me-2" />
          Payment Account Setup
        </h2>
        <p className="text-muted small">Configure your school's bank account to receive payments</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3 alert-dismissible fade show`}>
          <small>{message.text}</small>
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {isConfigured && (
        <div className="alert alert-success rounded-3 mb-4">
          <Check size={20} className="me-2" />
          <strong className="small">Payment Account Configured!</strong>
          <span className="small"> Your school can now receive payments.</span>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3 p-md-4">
              <div className="alert alert-info rounded-3 mb-4">
                <AlertCircle size={20} className="me-2" />
                <small>
                  <strong>Important:</strong> Money from school fees will be paid directly to this bank account. 
                  A {config?.paymentSettings?.platformFeePercentage || 5}% platform fee will be deducted automatically.
                </small>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Bank Code (Display if configured) */}
                {isConfigured && formData.bankCode && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Bank Code</label>
                    <input
                      type="text"
                      className="form-control rounded-3 bg-light"
                      value={formData.bankCode}
                      disabled
                      readOnly
                    />
                    <small className="text-muted">Current configured bank code</small>
                  </div>
                )}

                {/* Bank Name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    {isConfigured ? 'Current Bank' : 'Select Bank'} *
                  </label>
                  {isConfigured && formData.bankName ? (
                    <>
                      <input
                        type="text"
                        className="form-control rounded-3 bg-light"
                        value={formData.bankName}
                        disabled
                        readOnly
                      />
                      <small className="text-muted">
                        To change bank, contact support or update below
                      </small>
                    </>
                  ) : (
                    <select
                      className="form-select rounded-3"
                      value={formData.bankCode}
                      onChange={(e) => {
                        const selectedBank = banks.find(b => b.code === e.target.value);
                        setFormData({
                          ...formData,
                          bankCode: e.target.value,
                          bankName: selectedBank?.name || '',
                          accountName: ''
                        });
                      }}
                      required
                    >
                      <option value="">-- Select Bank --</option>
                      {banks.map(bank => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Account Number */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Account Number *
                  </label>
                  {isConfigured && formData.accountNumber ? (
                    <>
                      <input
                        type="text"
                        className="form-control rounded-3 bg-light"
                        value={formData.accountNumber}
                        disabled
                        readOnly
                      />
                      <small className="text-muted">
                        Current configured account number
                      </small>
                    </>
                  ) : (
                    <div className="input-group flex-column flex-md-row">
                      <input
                        type="text"
                        className="form-control rounded-3 rounded-md-start-3 rounded-md-end-0 mb-2 mb-md-0"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          accountNumber: e.target.value.replace(/\D/g, ''),
                          accountName: ''
                        })}
                        maxLength={10}
                        placeholder="0123456789"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-primary rounded-3 rounded-md-start-0 rounded-md-end-3 w-100 w-md-auto"
                        onClick={verifyAccount}
                        disabled={loading || !formData.bankCode || formData.accountNumber.length !== 10}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Verifying...
                          </>
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Account Name */}
                {formData.accountName && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Account Name</label>
                    <div className="alert alert-success rounded-3 mb-0">
                      <Check size={18} className="me-2" />
                      <strong className="small">{formData.accountName}</strong>
                    </div>
                  </div>
                )}

                <div className="card bg-light border-0 p-3 mb-4">
                  <small className="text-muted">
                    <strong>How it works:</strong>
                    <ul className="mb-0 mt-2" style={{ fontSize: '0.85rem' }}>
                      <li>Parents pay school fees online</li>
                      <li>Money goes directly to your bank account</li>
                      <li>Platform fee ({config?.paymentSettings?.platformFeePercentage || 5}%) is deducted automatically</li>
                      <li>You receive settlements within 24 hours</li>
                      <li>Payment links remain valid until payment is completed (no expiry)</li>
                    </ul>
                  </small>
                </div>

                {/* Show configure button only if not configured */}
                {!isConfigured && (
                  <button
                    type="submit"
                    className="btn btn-success w-100 rounded-3"
                    disabled={loading || !formData.accountName}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      'Configure Account'
                    )}
                  </button>
                )}

                {/* Show message if already configured */}
                {isConfigured && (
                  <div className="alert alert-warning rounded-3 mb-0">
                    <AlertCircle size={18} className="me-2" />
                    <small>
                      <strong>Account Already Configured.</strong> To update your payment account, 
                      please contact support for security verification.
                    </small>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Display Summary if Configured */}
          {isConfigured && (
            <div className="card border-0 shadow-sm rounded-4 mt-4 bg-light">
              <div className="card-body p-3 p-md-4">
                <h5 className="text-primary mb-3 fs-6">Configuration Summary</h5>
                <div className="row g-3">
                  <div className="col-6 col-md-6">
                    <small className="text-muted d-block mb-1">Bank Code</small>
                    <strong className="small">{formData.bankCode || 'N/A'}</strong>
                  </div>
                  <div className="col-6 col-md-6">
                    <small className="text-muted d-block mb-1">Bank Name</small>
                    <strong className="small">{formData.bankName || 'N/A'}</strong>
                  </div>
                  <div className="col-6 col-md-6">
                    <small className="text-muted d-block mb-1">Account Number</small>
                    <strong className="small">{formData.accountNumber || 'N/A'}</strong>
                  </div>
                  <div className="col-6 col-md-6">
                    <small className="text-muted d-block mb-1">Account Name</small>
                    <strong className="small">{formData.accountName || 'N/A'}</strong>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block mb-1">Platform Fee</small>
                    <strong className="small">{config?.paymentSettings?.platformFeePercentage || 5}%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;