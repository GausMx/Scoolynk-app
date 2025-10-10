import React, { useState } from 'react';
import { PeopleFill, EnvelopeOpenFill, PencilSquare, Send } from 'react-bootstrap-icons';
import Chart from 'react-apexcharts'; // For mini charts

const MOCK_STATS = {
  totalSent: 128,
  pending: 4,
  recipients: 352,
  recentOpenRate: 78, // %
};

// Mini chart config
const chartOptions = {
  chart: {
    type: 'radialBar',
    height: 100,
  },
  plotOptions: {
    radialBar: {
      hollow: { size: '60%' },
      dataLabels: { name: { show: false }, value: { fontSize: '14px', color: '#000' } },
    },
  },
  labels: ['Open Rate'],
};

const Broadcast = () => {
  const [recipient, setRecipient] = useState('all');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fakeAPICall = () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.1
          ? resolve({ message: `Broadcast sent to ${recipient}` })
          : reject(new Error('Network error'));
      }, 1500);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const data = await fakeAPICall();
      setStatusMessage(data.message);
      setSubject('');
      setMessageBody('');
    } catch (error) {
      setErrorMessage('Failed to send broadcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-3">
          <div className="card p-3 text-center shadow-sm rounded-4">
            <PeopleFill className="fs-2 text-primary mb-2" />
            <h6 className="text-muted">Total Messages Sent</h6>
            <h4 className="fw-bold">{MOCK_STATS.totalSent}</h4>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card p-3 text-center shadow-sm rounded-4">
            <EnvelopeOpenFill className="fs-2 text-info mb-2" />
            <h6 className="text-muted">Pending Messages</h6>
            <h4 className="fw-bold">{MOCK_STATS.pending}</h4>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card p-3 text-center shadow-sm rounded-4">
            <PeopleFill className="fs-2 text-success mb-2" />
            <h6 className="text-muted">Active Recipients</h6>
            <h4 className="fw-bold">{MOCK_STATS.recipients}</h4>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card p-3 text-center shadow-sm rounded-4">
            <Chart
              options={chartOptions}
              series={[MOCK_STATS.recentOpenRate]}
              type="radialBar"
              height={100}
            />
            <h6 className="text-muted mt-2">Recent Open Rate</h6>
          </div>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="card p-4 p-md-5 shadow-lg rounded-4">
        <h2 className="fs-4 fs-md-2 fw-bold text-primary mb-3 d-flex align-items-center">
          <EnvelopeOpenFill className="me-3 fs-3" /> Broadcast Communication
        </h2>
        <p className="text-secondary mb-4">
          Craft and send real-time announcements to specific user groups across your school.
        </p>

        {/* Alerts */}
        {statusMessage && (
          <div className="alert alert-success alert-dismissible fade show rounded-3 mb-4">
            <i className="bi bi-check-circle-fill me-2"></i>
            {statusMessage}
            <button type="button" className="btn-close" onClick={() => setStatusMessage('')} />
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
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
                <label htmlFor="recipient">Recipient Group</label>
              </div>
            </div>
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
                <label htmlFor="subject">Subject</label>
              </div>
            </div>
          </div>

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

          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary btn-lg rounded-3 d-flex align-items-center justify-content-center fw-bold"
              disabled={loading || !subject || !messageBody}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span> Sending...
                </>
              ) : (
                <>
                  <Send className="me-2" /> Send Broadcast
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
