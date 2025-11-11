// src/components/Admin/SMSBalanceWarning.js
// Display this at the top of Settings page when SMS fails

import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const SMSBalanceWarning = ({ error, errorCode }) => {
  if (!error || !errorCode) return null;

  const isBalanceError = errorCode === 'INSUFFICIENT_BALANCE';
  
  if (!isBalanceError) return null;

  return (
    <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4">
      <div className="d-flex align-items-start">
        <AlertTriangle size={24} className="text-warning me-3 mt-1" />
        <div className="flex-grow-1">
          <h5 className="alert-heading mb-2">SMS Service Needs Attention</h5>
          <p className="mb-3">{error}</p>
          
          <div className="bg-light rounded-3 p-3 mb-3">
            <h6 className="mb-2">How to Top Up Your SMS Balance:</h6>
            <ol className="mb-0 ps-3">
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

export default SMSBalanceWarning;