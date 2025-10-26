import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Smartphone, Building, AlertCircle, Clock } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const PaymentPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [token]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/payments/${token}`);
      setPaymentData(res.data.payment);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const res = await axios.post(`${REACT_APP_API_URL}/api/payments/${token}/initialize`, { email });
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary"></div>
          <p className="mt-3 text-muted">Loading...</p>
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
                  <AlertCircle size={64} className="text-danger mb-3" />
                  <h3 className="text-danger mb-3">Invalid Link</h3>
                  <p className="text-muted">{error}</p>
                  <button className="btn btn-primary rounded-3 mt-3" onClick={() => navigate('/')}>
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-primary">School Fee Payment</h2>
              <p className="text-muted">{paymentData?.schoolName}</p>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-4">Payment Details</h5>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Student Name</label>
                    <p className="fw-semibold mb-0">{paymentData?.studentName}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Class</label>
                    <p className="fw-semibold mb-0">{paymentData?.className}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Reg Number</label>
                    <p className="fw-semibold mb-0">{paymentData?.regNo}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Expires On</label>
                    <p className="fw-semibold mb-0 text-danger">
                      <Clock size={16} className="me-1" />
                      {new Date(paymentData?.expiresAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-2">Amount to Pay</p>
                  <h2 className="fw-bold text-success mb-0">
                    ₦{paymentData?.amount.toLocaleString()}
                  </h2>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-4">Payment Methods</h5>
                
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="card h-100 border">
                      <div className="card-body text-center p-4">
                        <CreditCard size={40} className="text-primary" />
                        <h6 className="mt-3 mb-1">Card</h6>
                        <small className="text-muted">Debit/Credit</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card h-100 border">
                      <div className="card-body text-center p-4">
                        <Smartphone size={40} className="text-primary" />
                        <h6 className="mt-3 mb-1">USSD</h6>
                        <small className="text-muted">Dial Code</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card h-100 border">
                      <div className="card-body text-center p-4">
                        <Building size={40} className="text-primary" />
                        <h6 className="mt-3 mb-1">Bank Transfer</h6>
                        <small className="text-muted">Direct</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-4">Complete Payment</h5>
                
                {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

                <form onSubmit={handlePayment}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control form-control-lg rounded-3"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                    <small className="text-muted">Receipt will be sent to this email</small>
                  </div>

                  <div className="alert alert-info rounded-3 mb-4">
                    <small>
                      <strong>Note:</strong> You'll be redirected to secure Paystack page. 
                      All payment methods available there.
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success btn-lg w-100 rounded-3"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      `Proceed to Payment - ₦${paymentData?.amount.toLocaleString()}`
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <small className="text-muted">🔒 Secure payment by Paystack</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;