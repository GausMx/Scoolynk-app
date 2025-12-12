// src/components/Public/PaymentVerification.js - COMPLETE

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader, DollarSign, AlertCircle } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const PaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('verifying');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setStatus('error');
      setMessage('No payment reference provided');
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      setStatus('verifying');
      
      console.log('Verifying payment with reference:', reference);
      
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/payments/verify/${reference}`
      );
      
      console.log('Verification response:', res.data);
      
      setStatus('success');
      setMessage(res.data.message);
      setPaymentInfo(res.data.payment);
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('failed');
      setMessage(err.response?.data?.message || 'Payment verification failed');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
               style={{ width: '100px', height: '100px' }}>
            <Loader size={50} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <h3 className="fw-bold mb-2">Verifying Payment...</h3>
          <p className="text-muted">Please wait while we confirm your payment</p>
          <div className="spinner-border text-primary mt-3"></div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body text-center p-5">
                  {/* Success Animation */}
                  <div className="mb-4">
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                         style={{ width: '120px', height: '120px' }}>
                      <CheckCircle size={60} className="text-success" />
                    </div>
                  </div>

                  <h2 className="fw-bold text-success mb-3">Payment Successful!</h2>
                  <p className="text-muted mb-4">{message}</p>

                  {/* Payment Details Card */}
                  {paymentInfo && (
                    <div className="bg-light rounded-4 p-4 mb-4">
                      <div className="row g-3 text-center">
                        <div className="col-12">
                          <small className="text-muted d-block mb-2">Amount Paid</small>
                          <h3 className="text-success fw-bold mb-0">
                            ₦{paymentInfo.amount?.toLocaleString()}
                          </h3>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block mb-1">School</small>
                          <strong className="small">{paymentInfo.schoolName}</strong>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block mb-1">Date</small>
                          <strong className="small">
                            {new Date(paymentInfo.paidAt).toLocaleDateString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  <div className="alert alert-success rounded-3 text-start">
                    <CheckCircle size={20} className="me-2" />
                    <strong>What's Next?</strong>
                    <ul className="mb-0 mt-2 small">
                      <li>A receipt has been sent to your email</li>
                      <li>Your payment has been recorded in the school system</li>
                      <li>The student's balance has been updated</li>
                    </ul>
                  </div>

                  {/* Reference Number */}
                  {reference && (
                    <div className="mt-4">
                      <small className="text-muted d-block mb-2">Transaction Reference</small>
                      <code className="bg-light px-3 py-2 rounded small">{reference}</code>
                    </div>
                  )}

                  <p className="text-muted small mt-4 mb-0">
                    You can safely close this page
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed' || status === 'error') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body text-center p-5">
                  {/* Error Icon */}
                  <div className="mb-4">
                    <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                         style={{ width: '120px', height: '120px' }}>
                      <XCircle size={60} className="text-danger" />
                    </div>
                  </div>

                  <h2 className="fw-bold text-danger mb-3">Payment Verification Failed</h2>
                  <p className="text-muted mb-4">{message}</p>

                  {/* Error Details */}
                  <div className="alert alert-danger rounded-3 text-start">
                    <AlertCircle size={20} className="me-2" />
                    <strong>What You Can Do:</strong>
                    <ul className="mb-0 mt-2 small">
                      <li>Check if the payment was deducted from your account</li>
                      <li>Wait a few minutes and refresh this page</li>
                      <li>Contact your school with the transaction reference</li>
                      <li>Check your email for payment confirmation</li>
                    </ul>
                  </div>

                  {/* Reference Number if Available */}
                  {reference && (
                    <div className="mt-4">
                      <small className="text-muted d-block mb-2">Transaction Reference</small>
                      <code className="bg-light px-3 py-2 rounded small">{reference}</code>
                    </div>
                  )}

                  {/* Retry Button */}
                  <button 
                    className="btn btn-primary rounded-3 mt-4"
                    onClick={verifyPayment}
                  >
                    Try Again
                  </button>

                  <p className="text-muted small mt-4 mb-0">
                    If the problem persists, please contact your school administration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Add spinning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default PaymentVerification;