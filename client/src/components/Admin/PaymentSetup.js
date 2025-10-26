import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Check, AlertCircle } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const PaymentSetup = () => {
  const [loading, setLoading] = useState(false);
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
    fetchBanks();
    checkConfiguration();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/subaccount/banks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanks(res.data.banks);
    } catch (err) {
      console.error('Failed to fetch banks:', err);
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
          ...formData,
          accountNumber: res.data.bankDetails.accountNumber,
          accountName: res.data.bankDetails.accountName,
          bankCode: res.data.bankDetails.bankCode,
          bankName: res.data.bankDetails.bankName
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

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-primary d-flex align-items-center">
          <Building size={32} className="me-2" />
          Payment Account Setup
        </h2>
        <p className="text-muted">Configure your school's bank account to receive payments</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3`}>
          {message.text}
        </div>
      )}

      {isConfigured && (
        <div className="alert alert-success rounded-3 mb-4">
          <Check size={20} className="me-2" />
          <strong>Payment Account Configured!</strong> Your school can now receive payments.
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="alert alert-info rounded-3 mb-4">
                <AlertCircle size={20} className="me-2" />
                <small>
                  <strong>Important:</strong> Money from school fees will be paid directly to this bank account. 
                  A {config?.paymentSettings?.platformFeePercentage || 5}% platform fee will be deducted automatically.
                </small>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select Bank *</label>
                  <select
                    className="form-select rounded-3"
                    value={formData.bankCode}
                    onChange={(e) => {
                      const selectedBank = banks.find(b => b.code === e.target.value);
                      setFormData({
                        ...formData,
                        bankCode: e.target.value,
                        bankName: selectedBank?.name || '',
                        accountName: '' // Reset verification
                      });
                    }}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                    {banks.map(bank => (
                      <option key={bank.code} value={bank.code}>{bank.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Account Number *</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded-start-3"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        accountNumber: e.target.value.replace(/\D/g, ''),
                        accountName: '' // Reset verification
                      })}
                      maxLength={10}
                      placeholder="0123456789"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-primary rounded-end-3"
                      onClick={verifyAccount}
                      disabled={loading || !formData.bankCode || formData.accountNumber.length !== 10}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {formData.accountName && (
                  <div className="alert alert-success rounded-3 mb-3">
                    <Check size={18} className="me-2" />
                    <strong>Account Name:</strong> {formData.accountName}
                  </div>
                )}

                <div className="card bg-light border-0 p-3 mb-4">
                  <small className="text-muted">
                    <strong>How it works:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Parents pay school fees online</li>
                      <li>Money goes directly to your bank account</li>
                      <li>Platform fee ({config?.paymentSettings?.platformFeePercentage || 5}%) is deducted automatically</li>
                      <li>You receive settlements within 24 hours</li>
                    </ul>
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 rounded-3"
                  disabled={loading || !formData.accountName}
                >
                  {loading ? 'Processing...' : (isConfigured ? 'Update Account' : 'Configure Account')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;