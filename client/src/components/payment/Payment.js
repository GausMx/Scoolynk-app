// src/pages/Payment.js - Public payment page for parents

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, 
  Building, 
  User, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Loader,
  ArrowLeft,
  Check
} from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const Payment = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [token]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/payments/${token}`);
      setPayment(res.data.payment);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePayment = async () => {
    // Validate email
    if (!email) {
      setEmailError('Email address is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setPaying(true);
      setEmailError('');
      
      const res = await axios.post(`${REACT_APP_API_URL}/api/payments/initialize`, {
        token,
        email
      });

      // Redirect to Paystack payment page
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <Loader size={48} className="text-primary mb-3 spinner-border" />
          <p className="text-muted">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body text-center p-5">
                  <AlertCircle size={64} className="text-danger mb-3" />
                  <h3 className="text-danger mb-3">Payment Error</h3>
                  <p className="text-muted mb-4">{error}</p>
                  <button 
                    className="btn btn-outline-primary rounded-3"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main payment form
  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                <CreditCard size={40} className="text-primary" />
              </div>
              <h2 className="fw-bold text-primary mb-2">School Fee Payment</h2>
              <p className="text-muted">Secure online payment portal</p>
            </div>

            {/* School Info Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <Building size={24} className="text-primary me-3" />
                  <div>
                    <small className="text-muted d-block">School</small>
                    <h5 className="mb-0">{payment.schoolName}</h5>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">
                <h6 className="text-primary mb-3">Student Information</h6>
                
                <div className="d-flex align-items-center mb-3">
                  <User size={20} className="text-muted me-3" />
                  <div>
                    <small className="text-muted d-block">Full Name</small>
                    <strong>{payment.studentName}</strong>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-3">
                  <CreditCard size={20} className="text-muted me-3" />
                  <div>
                    <small className="text-muted d-block">Class</small>
                    <span className="badge bg-info text-dark">{payment.className}</span>
                  </div>
                </div>

                <div className="d-flex align-items-center">
                  <DollarSign size={20} className="text-muted me-3" />
                  <div>
                    <small className="text-muted d-block">Registration Number</small>
                    <strong>{payment.regNo}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-3 bg-primary bg-gradient">
              <div className="card-body p-4 text-white text-center">
                <small className="d-block mb-2 opacity-75">Amount to Pay</small>
                <h1 className="display-4 fw-bold mb-0">₦{payment.amount.toLocaleString()}</h1>
              </div>
            </div>

            {/* Payment Form Card */}
            <div className="card border-0 shadow-lg rounded-4 mb-3">
              <div className="card-body p-4">
                <h6 className="text-primary mb-3">Payment Details</h6>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Email Address *</label>
                  <input
                    type="email"
                    className={`form-control form-control-lg rounded-3 ${emailError ? 'is-invalid' : ''}`}
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    required
                  />
                  {emailError && (
                    <div className="invalid-feedback">{emailError}</div>
                  )}
                  <small className="text-muted">
                    Payment receipt will be sent to this email
                  </small>
                </div>

                {/* Payment Methods Info */}
                <div className="card bg-light border-0 p-3 mb-4">
                  <small className="fw-semibold text-dark mb-2">Available Payment Methods:</small>
                  <div className="row g-2">
                    <div className="col-4">
                      <div className="text-center p-2 bg-white rounded">
                        <CreditCard size={20} className="text-primary mb-1" />
                        <small className="d-block">Card</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-2 bg-white rounded">
                        <Building size={20} className="text-primary mb-1" />
                        <small className="d-block">USSD</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-2 bg-white rounded">
                        <DollarSign size={20} className="text-primary mb-1" />
                        <small className="d-block">Transfer</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expiry Notice - Only show if there's an expiry date */}
                {payment.expiresAt ? (
                  <div className="alert alert-warning rounded-3 mb-4">
                    <Calendar size={18} className="me-2" />
                    <small>
                      <strong>Note:</strong> This payment link expires on{' '}
                      {new Date(payment.expiresAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </small>
                  </div>
                ) : (
                  <div className="alert alert-success rounded-3 mb-4">
                    <Check size={18} className="me-2" />
                    <small>
                      <strong>Good News:</strong> This payment link remains valid until payment is completed. 
                      No expiry date!
                    </small>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  className="btn btn-primary btn-lg w-100 rounded-3 mb-3"
                  onClick={handlePayment}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} className="me-2" />
                      Proceed to Payment
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="text-center">
                  <small className="text-muted">
                    🔒 Secured by Paystack • Your payment information is encrypted
                  </small>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="card border-0 bg-white rounded-4 shadow-sm">
              <div className="card-body p-4">
                <h6 className="text-primary mb-3">Payment Information</h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <CheckCircle size={16} className="text-success me-2" />
                    <small>Payment is processed securely via Paystack</small>
                  </li>
                  <li className="mb-2">
                    <CheckCircle size={16} className="text-success me-2" />
                    <small>Your student record will be updated automatically</small>
                  </li>
                  <li className="mb-2">
                    <CheckCircle size={16} className="text-success me-2" />
                    <small>You will receive a confirmation email and SMS</small>
                  </li>
                  <li>
                    <CheckCircle size={16} className="text-success me-2" />
                    <small>Contact school for any payment issues</small>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;