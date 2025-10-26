import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const PaymentSuccess = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState('');
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      const verify = async () => {
        try {
          const res = await axios.get(`${REACT_APP_API_URL}/api/payments/verify/${reference}`);
          setVerified(true);
          setPaymentDetails(res.data.payment);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed.');
        } finally {
          setVerifying(false);
        }
      };
      verify();
    } else {
      setError('No reference.');
      setVerifying(false);
    }
  }, [reference]);

  if (verifying) return (<div className="min-vh-100 d-flex align-items-center justify-content-center bg-light"><div className="text-center"><div className="spinner-border text-primary mb-3"></div><h4 className="text-primary">Verifying...</h4></div></div>);

  if (verified && paymentDetails) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container"><div className="row justify-content-center"><div className="col-md-6">
          <div className="card shadow-lg rounded-4"><div className="card-body text-center p-5">
            <CheckCircle size={80} className="text-success mb-4" />
            <h2 className="text-success fw-bold mb-3">Success!</h2>
            <p className="text-muted mb-4">Payment confirmed.</p>
            <div className="bg-light rounded-3 p-4 mb-4"><div className="row g-3">
              <div className="col-12"><label className="text-muted small d-block">Amount</label><h3 className="fw-bold text-success mb-0">₦{paymentDetails.amount?.toLocaleString()}</h3></div>
              <div className="col-6"><label className="text-muted small d-block">Status</label><span className="badge bg-success">{paymentDetails.status}</span></div>
              <div className="col-6"><label className="text-muted small d-block">Date</label><p className="mb-0 small">{new Date(paymentDetails.paidAt).toLocaleDateString('en-GB')}</p></div>
            </div></div>
            <div className="alert alert-info rounded-3 mb-4"><small>Receipt sent to email.</small></div>
            <button className="btn btn-primary rounded-3 px-5" onClick={() => navigate('/')}>Done</button>
          </div></div>
        </div></div></div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container"><div className="row justify-content-center"><div className="col-md-6">
        <div className="card shadow-lg rounded-4"><div className="card-body text-center p-5">
          <XCircle size={80} className="text-danger mb-4" />
          <h2 className="text-danger fw-bold mb-3">Verification Failed</h2>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary rounded-3" onClick={() => navigate('/')}>Go Home</button>
        </div></div>
      </div></div></div>
    </div>
  );
};

export default PaymentSuccess;