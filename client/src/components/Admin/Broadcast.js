import React, { useState } from 'react';

// Bootstrap icons
const Send = ({ className }) => <i className={`bi bi-send-fill ${className}`}></i>;
const Mail = ({ className }) => <i className={`bi bi-envelope-open-fill fs-3 ${className}`}></i>;
const UserIcon = ({ className }) => <i className={`bi bi-people-fill ${className}`}></i>;
const SubjectIcon = ({ className }) => <i className={`bi bi-pencil-square ${className}`}></i>;

const Broadcast = () => {
  const [recipient, setRecipient] = useState('all');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Placeholder backend call (API ready)
  const fakeAPICall = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for realism
        const success = Math.random() > 0.1;
        if (success) {
          resolve({ message: `Successfully broadcasted message to ${recipient}.` });
        } else {
          reject(new Error('Network error occurred.'));
        }
      }, 1500);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      // Simulated placeholder (replace later with real fetch call)
      const data = await fakeAPICall();
      setStatusMessage(data.message);
      setSubject('');
      setMessageBody('');
    } catch (error) {
      console.error('Broadcast Error:', error);
      setErrorMessage('Failed to send broadcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      {/* Custom CSS */}
      <style jsx="true">{`
        body {
          font-family: 'Inter', sans-serif;
        }

        .sleek-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 1.5rem !important;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08),
            0 3px 6px rgba(0, 0, 0, 0.05);
        }

        .sleek-title {
          color: #2563eb; /* blue-600 */
          font-weight: 700 !important;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #eff6ff;
        }

        .form-control,
        .form-select {
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          border-color: #ddd;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.25);
        }

        .sleek-btn {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: none;
          transition: all 0.3s ease;
          font-size: 1.1rem;
          padding: 0.75rem 1.5rem;
        }

        .sleek-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(37, 99, 235, 0.4);
        }

        .sleek-btn:disabled {
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .sleek-card {
            padding: 1.5rem !important;
          }
          .py-5 {
            padding-top: 1.5rem !important;
            padding-bottom: 1.5rem !important;
          }
        }
      `}</style>

      <div className="sleek-card p-4 p-md-5 mx-auto" style={{ maxWidth: '700px' }}>
        {/* Header */}
        <h2 className="text-2xl sleek-title mb-4 d-flex align-items-center">
          <Mail className="me-3" /> Broadcast Communication
        </h2>
        <p className="text-secondary mb-4">
          Craft and send real-time announcements to specific user groups across your school.
        </p>

        {/* Alert Messages */}
        {statusMessage && (
          <div
            className="alert alert-success d-flex align-items-center rounded-3 mb-4 fade show"
            role="alert"
          >
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{statusMessage}</div>
            <button
              type="button"
              className="btn-close ms-auto"
              onClick={() => setStatusMessage('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        {errorMessage && (
          <div
            className="alert alert-danger d-flex align-items-center rounded-3 mb-4 fade show"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div>{errorMessage}</div>
            <button
              type="button"
              className="btn-close ms-auto"
              onClick={() => setErrorMessage('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            {/* Recipient */}
            <div className="col-12 col-md-6">
              <div className="form-floating">
                <select
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="all">All Users</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="parents">Parents Only</option>
                  <option value="jss1">JSS 1 Students/Parents</option>
                  <option value="sss3">SSS 3 Students/Parents</option>
                </select>
                <label htmlFor="recipient">
                  <UserIcon className="me-2" /> Recipient Group
                </label>
              </div>
            </div>

            {/* Subject */}
            <div className="col-12 col-md-6">
              <div className="form-floating">
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-control"
                  placeholder="Subject"
                  required
                />
                <label htmlFor="subject">
                  <SubjectIcon className="me-2" /> Subject
                </label>
              </div>
            </div>
          </div>

          {/* Message Body */}
          <div className="mb-4">
            <label htmlFor="messageBody" className="form-label fw-semibold text-dark">
              Message Content
            </label>
            <textarea
              id="messageBody"
              rows="8"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="form-control"
              placeholder="Type your announcement or message..."
              style={{ resize: 'vertical' }}
              required
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="d-grid">
            <button
              type="submit"
              className="btn sleek-btn btn-lg rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-bold text-white"
              disabled={loading || !subject || !messageBody}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="me-2 fs-5" /> Send Broadcast Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Broadcast;
