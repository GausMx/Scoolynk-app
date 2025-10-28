// src/pages/PaymentVerify.js - COMPLETE PAYMENT VERIFICATION PAGE

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader, Download, Home } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const PaymentVerify = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'success' | 'failed'
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setError('Invalid payment reference');
      setLoading(false);
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/payments/verify/${reference}`);
      
      setStatus('success');
      setPayment(res.data.payment);
      setError('');
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <Loader size={64} className="text-primary mb-3 spinner-border" />
          <h4 className="text-primary mb-2">Verifying Payment...</h4>
          <p className="text-muted">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success' && payment) {
    return (
      <div className="min-vh-100 bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              {/* Success Animation */}
              <div className="text-center mb-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                  <CheckCircle size={80} className="text-success" />
                </div>
                <h2 className="fw-bold text-success mb-2">Payment Successful!</h2>
                <p className="text-muted">Your payment has been confirmed</p>
              </div>

              {/* Receipt Card */}
              <div className="card border-0 shadow-lg rounded-4 mb-3" id="receipt">
                <div className="card-body p-4">
                  <div className="text-center mb-4 pb-3 border-bottom">
                    <h5 className="text-primary mb-1">Payment Receipt</h5>
                    <small className="text-muted">Transaction Confirmation</small>
                  </div>

                  {/* Payment Details */}
                  <div className="mb-3">
                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Amount Paid</small>
                      </div>
                      <div className="col-6 text-end">
                        <strong className="text-success">₦{payment.amount?.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Payment Date</small>
                      </div>
                      <div className="col-6 text-end">
                        <strong>{new Date(payment.paidAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</strong>
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Payment Method</small>
                      </div>
                      <div className="col-6 text-end">
                        <span className="badge bg-primary text-capitalize">{payment.paymentMethod || 'Card'}</span>
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-6">
                        <small className="text-muted">Reference</small>
                      </div>
                      <div className="col-6 text-end">
                        <small className="font-monospace">{reference}</small>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Status</small>
                      </div>
                      <div className="col-6 text-end">
                        <span className="badge bg-success">
                          <CheckCircle size={14} className="me-1" />
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr />

                  {/* Student Info */}
                  <div className="bg-light rounded-3 p-3 mb-3">
                    <small className="text-muted d-block mb-2">Student Information</small>
                    {payment.metadata?.studentName && (
                      <div className="mb-1">
                        <strong>Name:</strong> {payment.metadata.studentName}
                      </div>
                    )}
                    {payment.metadata?.className && (
                      <div className="mb-1">
                        <strong>Class:</strong> {payment.metadata.className}
                      </div>
                    )}
                    {payment.metadata?.regNo && (
                      <div>
                        <strong>Reg No:</strong> {payment.metadata.regNo}
                      </div>
                    )}
                  </div>

                  {/* Important Notice */}
                  <div className="alert alert-info rounded-3 mb-0">
                    <small>
                      <strong>Important:</strong> Keep this receipt for your records. 
                      A copy has been sent to your email address.
                    </small>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary rounded-3 flex-fill"
                  onClick={printReceipt}
                >
                  <Download size={18} className="me-2" />
                  Print Receipt
                </button>
                <button 
                  className="btn btn-primary rounded-3 flex-fill"
                  onClick={() => window.close()}
                >
                  <Home size={18} className="me-2" />
                  Close
                </button>
              </div>

              {/* Next Steps */}
              <div className="card border-0 bg-white rounded-4 shadow-sm mt-3">
                <div className="card-body p-4">
                  <h6 className="text-primary mb-3">What Happens Next?</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <CheckCircle size={16} className="text-success me-2" />
                      <small>Your student record has been updated automatically</small>
                    </li>
                    <li className="mb-2">
                      <CheckCircle size={16} className="text-success me-2" />
                      <small>Payment receipt sent to your email</small>
                    </li>
                    <li className="mb-2">
                      <CheckCircle size={16} className="text-success me-2" />
                      <small>School has been notified of your payment</small>
                    </li>
                    <li>
                      <CheckCircle size={16} className="text-success me-2" />
                      <small>Contact school for any questions or concerns</small>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body text-center p-5">
                <XCircle size={80} className="text-danger mb-3" />
                <h3 className="text-danger mb-3">Payment Failed</h3>
                <p className="text-muted mb-4">
                  {error || 'We could not verify your payment. Please contact the school for assistance.'}
                </p>
                
                <div className="alert alert-warning rounded-3 text-start mb-4">
                  <small>
                    <strong>What to do next:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Check your bank account for any deductions</li>
                      <li>Contact your bank if money was deducted</li>
                      <li>Contact the school with your transaction reference</li>
                      <li>Try making the payment again if no deduction occurred</li>
                    </ul>
                  </small>
                </div>

                {reference && (
                  <div className="card bg-light border-0 p-3 mb-4">
                    <small className="text-muted">Transaction Reference:</small>
                    <code className="d-block mt-1">{reference}</code>
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-center">
                  <button 
                    className="btn btn-outline-secondary rounded-3"
                    onClick={() => window.close()}
                  >
                    Close
                  </button>
                  <button 
                    className="btn btn-primary rounded-3"
                    onClick={() => window.location.href = `/payment/${token}`}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerify;