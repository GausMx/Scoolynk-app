// src/components/Admin/SendPaymentLinkModal.js - MOBILE RESPONSIVE VERSION

import React, { useState } from 'react';
import axios from 'axios';
import { Send, X, DollarSign, User, CreditCard, AlertCircle, Check, Loader } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const SendPaymentLinkModal = ({ student, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sendMethod, setSendMethod] = useState('sms');

  const token = localStorage.getItem('accessToken');

  const balance = (student.classId?.fee || 0) - (student.amountPaid || 0);

  const handleSendLink = async () => {
    if (!student.parentPhone && sendMethod === 'sms') {
      setMessage({ type: 'error', text: 'No parent phone number available' });
      return;
    }

    try {
      setLoading(true);
      
      if (sendMethod === 'sms') {
        const res = await axios.post(
          `${REACT_APP_API_URL}/api/payments/send-link`,
          { studentId: student._id },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        setMessage({ type: 'success', text: res.data.message });
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 2000);
      } else {
        const res = await axios.post(
          `${REACT_APP_API_URL}/api/payments/create-link`,
          { studentId: student._id },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        await navigator.clipboard.writeText(res.data.paymentLink);
        setMessage({ type: 'success', text: 'Payment link copied to clipboard!' });
        
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to send payment link' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (balance <= 0) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered mx-3">
          <div className="modal-content rounded-4 shadow-lg">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title text-primary fs-6">
                <AlertCircle size={24} className="me-2" />
                No Outstanding Balance
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info rounded-3">
                <small><strong>{student.name}</strong> has no outstanding fees. All payments are complete!</small>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button className="btn btn-secondary rounded-3 w-100 w-md-auto" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered mx-3">
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title text-primary fs-6">
              <Send size={24} className="me-2" />
              Send Payment Link
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {message.text && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3`}>
                {message.type === 'success' ? <Check size={18} className="me-2" /> : <AlertCircle size={18} className="me-2" />}
                <small>{message.text}</small>
              </div>
            )}

            {/* Student Info Card */}
            <div className="card bg-light border-0 p-3 mb-3">
              <div className="d-flex align-items-center mb-2">
                <User size={20} className="text-primary me-2 flex-shrink-0" />
                <div>
                  <h6 className="mb-0 small">{student.name}</h6>
                  <small className="text-muted">Reg No: {student.regNo}</small>
                </div>
              </div>
              
              <div className="d-flex align-items-center mb-2">
                <CreditCard size={20} className="text-success me-2 flex-shrink-0" />
                <div>
                  <small className="text-muted">Class: </small>
                  <span className="badge bg-info text-dark">{student.classId?.name}</span>
                </div>
              </div>

              <div className="border-top pt-2 mt-2">
                <div className="row text-center g-2">
                  <div className="col-4">
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Fee</small>
                    <strong className="small">₦{(student.classId?.fee || 0).toLocaleString()}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Paid</small>
                    <strong className="text-success small">₦{(student.amountPaid || 0).toLocaleString()}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Balance</small>
                    <strong className="text-danger small">₦{balance.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Contact Info */}
            {student.parentPhone ? (
              <div className="card border-success border-2 p-3 mb-3">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                    <Send size={20} className="text-success" />
                  </div>
                  <div>
                    <small className="text-muted d-block">Parent Phone</small>
                    <strong className="small">{student.parentPhone}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning rounded-3">
                <AlertCircle size={18} className="me-2" />
                <small>No parent phone number on record. You can only copy the link.</small>
              </div>
            )}

            {/* Send Method Selection */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Delivery Method</label>
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="sendMethod"
                  id="method-sms"
                  value="sms"
                  checked={sendMethod === 'sms'}
                  onChange={(e) => setSendMethod(e.target.value)}
                  disabled={!student.parentPhone}
                />
                <label 
                  className={`btn btn-outline-primary ${!student.parentPhone ? 'disabled' : ''}`} 
                  htmlFor="method-sms"
                >
                  <Send size={16} className="me-1" />
                  <span className="d-none d-md-inline">Send via SMS</span>
                  <span className="d-md-none">SMS</span>
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="sendMethod"
                  id="method-link"
                  value="link"
                  checked={sendMethod === 'link'}
                  onChange={(e) => setSendMethod(e.target.value)}
                />
                <label className="btn btn-outline-primary" htmlFor="method-link">
                  <DollarSign size={16} className="me-1" />
                  <span className="d-none d-md-inline">Copy Link Only</span>
                  <span className="d-md-none">Copy Link</span>
                </label>
              </div>
              <small className="text-muted">
                {sendMethod === 'sms' 
                  ? 'SMS will be sent to parent\'s phone number' 
                  : 'Payment link will be copied to clipboard'}
              </small>
            </div>

            {/* Information Box */}
            <div className="card bg-info bg-opacity-10 border-0 p-3">
              <small className="text-dark">
                <strong>Payment Link Details:</strong>
                <ul className="mb-0 mt-2" style={{ fontSize: '0.85rem' }}>
                  <li>Valid until payment is completed (no expiry)</li>
                  <li>Parent can pay via Card, USSD, or Bank Transfer</li>
                  <li>Payment goes directly to school account</li>
                  <li>Student record updates automatically</li>
                </ul>
              </small>
            </div>
          </div>

          <div className="modal-footer border-0 flex-column flex-md-row gap-2">
            <button 
              className="btn btn-secondary rounded-3 w-100 w-md-auto order-2 order-md-1" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary rounded-3 px-4 w-100 w-md-auto order-1 order-md-2"
              onClick={handleSendLink}
              disabled={loading || (!student.parentPhone && sendMethod === 'sms')}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  {sendMethod === 'sms' ? (
                    <>
                      <Send size={16} className="me-2" />
                      Send SMS
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} className="me-2" />
                      Copy Link
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendPaymentLinkModal;