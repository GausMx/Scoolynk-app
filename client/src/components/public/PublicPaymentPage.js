// src/components/Public/PublicPaymentPage.js - UPDATED FOR PARTIAL PAYMENTS

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  DollarSign, 
  User, 
  School, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Loader,
  Info
} from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const PublicPaymentPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentDetails();
  }, [token]);

// src/components/Public/PublicPaymentPage.js

const fetchPaymentDetails = async () => {
  try {
    setLoading(true);
    const res = await axios.get(`${REACT_APP_API_URL}/api/payments/${token}`);
    setPaymentData(res.data);
    setEmail(res.data.student.parentEmail || '');
    setError('');
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Invalid payment link';
    const errorCode = err.response?.data?.code;
    const statusCode = err.response?.status;
    
    // ✅ Handle rate limit error specifically
    if (statusCode === 429 || errorCode === 'RATE_LIMIT_EXCEEDED') {
      setError('Too many requests. Please wait a moment and try again.');
    } else if (errorCode === 'FULLY_PAID') {
      setError('This payment has been completed in full. Thank you! 🎉');
    } else {
      setError(errorMsg);
    }
    
    console.error('Payment details error:', err);
  } finally {
    setLoading(false);
  }
};

  const handlePayment = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/payments/${token}/initialize`,
        { email }
      );
      
      console.log('Payment initialized:', res.data);
      
      // Redirect to Paystack
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initialization failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <h5 className="text-muted">Loading payment details...</h5>
        </div>
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body text-center p-5">
                  <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <AlertCircle size={40} className="text-danger" />
                  </div>
                  <h3 className="text-danger mb-3">Payment Link Issue</h3>
                  <p className="text-muted">{error}</p>
                  <small className="text-muted d-block mt-3">
                    {error.includes('completed') 
                      ? 'All fees have been paid. No action needed.'
                      : 'Please contact your school for assistance.'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { student, school, payment } = paymentData;
  const isPartialPayment = payment.amountPaid > 0;

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                   style={{ width: '80px', height: '80px' }}>
                <School size={40} className="text-primary" />
              </div>
              <h2 className="fw-bold text-primary mb-2">Pay School Fees</h2>
              <p className="text-muted">{school.name}</p>
            </div>

            {/* Main Card */}
            <div className="card border-0 shadow-lg rounded-4 mb-4">
              <div className="card-body p-4 p-md-5">
                {error && (
                  <div className="alert alert-danger rounded-3 d-flex align-items-center mb-4">
                    <AlertCircle size={20} className="me-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ✅ Show partial payment info if applicable */}
                {isPartialPayment && (
                  <div className="alert alert-info rounded-3 mb-4">
                    <Info size={20} className="me-2" />
                    <strong>Partial Payment Detected</strong>
                    <p className="mb-0 small mt-2">
                      You've already paid ₦{payment.amountPaid.toLocaleString()}. 
                      This payment is for the remaining balance.
                    </p>
                  </div>
                )}

                {/* Student Details */}
                <div className="bg-light rounded-4 p-4 mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <User size={24} className="text-primary me-3" />
                    <div>
                      <small className="text-muted d-block">Student Name</small>
                      <strong className="fs-5">{student.name}</strong>
                    </div>
                  </div>
                  
                  <div className="row g-3 text-center">
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Registration No.</small>
                      <span className="badge bg-primary fs-6">{student.regNo}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Class</small>
                      <span className="badge bg-info fs-6">{student.className}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="border-top border-bottom py-4 mb-4">
                  <div className="row g-3 text-center">
                    <div className="col-4">
                      <small className="text-muted d-block mb-2">Total Fee</small>
                      <h6 className="mb-0">₦{payment.totalFee.toLocaleString()}</h6>
                    </div>
                    <div className="col-4">
                      <small className="text-muted d-block mb-2">Paid</small>
                      <h6 className="text-success mb-0">₦{payment.amountPaid.toLocaleString()}</h6>
                    </div>
                    <div className="col-4">
                      <small className="text-muted d-block mb-2">Balance</small>
                      <h6 className="text-danger mb-0">₦{payment.balance.toLocaleString()}</h6>
                    </div>
                  </div>
                </div>

                {/* Amount to Pay */}
                <div className="bg-success bg-opacity-10 rounded-4 p-4 mb-4 text-center">
                  <small className="text-success fw-semibold d-block mb-2">AMOUNT TO PAY</small>
                  <h2 className="text-success fw-bold mb-0">
                    ₦{payment.balance.toLocaleString()}
                  </h2>
                  {isPartialPayment && (
                    <small className="text-muted d-block mt-2">
                      (Remaining Balance)
                    </small>
                  )}
                </div>

                {/* ✅ Show warning if below minimum but still allow */}
                {payment.minimumWarning && (
                  <div className="alert alert-warning rounded-3 mb-4">
                    <AlertCircle size={18} className="me-2" />
                    <small>{payment.minimumWarning}</small>
                  </div>
                )}

                {/* Email Input */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-3"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={processing}
                  />
                  <small className="text-muted">
                    Payment receipt will be sent to this email
                  </small>
                </div>

                {/* Pay Button */}
                <button 
                  className="btn btn-primary btn-lg w-100 rounded-3 py-3"
                  onClick={handlePayment}
                  disabled={!email || processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} className="me-2" />
                      Proceed to Payment
                    </>
                  )}
                </button>

                {/* Payment Methods Info */}
                <div className="text-center mt-4">
                  <small className="text-muted">
                    Secure payment powered by Paystack
                  </small>
                  <div className="d-flex justify-content-center gap-2 mt-2">
                    <span className="badge bg-light text-dark">Card</span>
                    <span className="badge bg-light text-dark">Bank Transfer</span>
                    <span className="badge bg-light text-dark">USSD</span>
                  </div>
                </div>

                {/* ✅ Partial payment note */}
                {payment.allowPartialPayment && (
                  <div className="mt-4 p-3 bg-info bg-opacity-10 rounded-3">
                    <small className="text-dark">
                      <CheckCircle size={16} className="me-2 text-success" />
                      <strong>Partial payments accepted.</strong> You can pay any amount and complete the balance later using the same link.
                    </small>
                  </div>
                )}
              </div>
            </div>

            {/* School Contact Info */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3">Need Help?</h6>
                <div className="d-flex align-items-start mb-2">
                  <School size={18} className="text-primary me-2 mt-1" />
                  <div>
                    <small className="text-muted d-block">School Contact</small>
                    <span className="small">{school.phone}</span>
                  </div>
                </div>
                {school.address && (
                  <div className="d-flex align-items-start">
                    <AlertCircle size={18} className="text-primary me-2 mt-1" />
                    <small className="text-muted">{school.address}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPaymentPage;