// src/components/Parent/ParentDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import Loading from '../common/Loading';
import { getUser } from '../utils/auth';

const { REACT_APP_API_URL } = process.env;

const ParentDashboard = () => {
  const navigate = useNavigate();
  const user  = getUser();
  const token = localStorage.getItem('accessToken');

  const [loading,        setLoading]        = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [dashboardData,  setDashboardData]  = useState({
    school: {}, children: [], totalChildren: 0,
    totalResults: 0, avgPerformance: 0, recentResults: [], notifications: []
  });

  // ── Passport upload state ──────────────────────────────────────────────────
  const [uploadModal,    setUploadModal]    = useState(null);  // child object or null
  const [previewSrc,     setPreviewSrc]     = useState('');    // base64 preview
  const [uploading,      setUploading]      = useState(false);
  const [uploadMsg,      setUploadMsg]      = useState({ type: '', text: '' });
  const fileInputRef = useRef();

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);
      const res = await axios.get(`${REACT_APP_API_URL}/api/parent/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoadingPercent(70);
      setDashboardData(res.data);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // ── Open upload modal for a child ──────────────────────────────────────────
  const openUploadModal = (child) => {
    setUploadModal(child);
    setPreviewSrc(child.passportBase64 || '');
    setUploadMsg({ type: '', text: '' });
    // reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeUploadModal = () => {
    setUploadModal(null);
    setPreviewSrc('');
    setUploading(false);
    setUploadMsg({ type: '', text: '' });
  };

  // ── File selected → convert to base64 preview ─────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadMsg({ type: 'error', text: 'Please select an image file (JPEG or PNG).' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg({ type: 'error', text: 'Image must be under 2 MB.' });
      return;
    }

    setUploadMsg({ type: '', text: '' });
    const reader = new FileReader();
    reader.onloadend = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Submit passport to backend ─────────────────────────────────────────────
  const handleUpload = async () => {
    if (!previewSrc || !uploadModal) return;
    if (!previewSrc.startsWith('data:image/')) {
      setUploadMsg({ type: 'error', text: 'Please select a new photo first.' });
      return;
    }

    try {
      setUploading(true);
      setUploadMsg({ type: '', text: '' });

      await axios.put(
        `${REACT_APP_API_URL}/api/parent/children/${uploadModal._id}/passport`,
        { passportBase64: previewSrc },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUploadMsg({ type: 'success', text: 'Photo uploaded! It will appear on the result sheet.' });

      // Update the child in local state so passport icon updates immediately
      setDashboardData(prev => ({
        ...prev,
        children: prev.children.map(c =>
          c._id === uploadModal._id ? { ...c, passportBase64: previewSrc } : c
        )
      }));

      // Close after short delay so user sees success message
      setTimeout(closeUploadModal, 1800);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed. Try again.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading percentage={loadingPercent} />;

  return (
    <Layout user={user} role="parent">
      <div className="container-fluid py-4 px-4" style={{ paddingTop: '140px', maxWidth: '1400px' }}>

        {/* Welcome Header */}
        <div className="mb-4">
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-house-heart-fill me-2 text-primary"></i>
            Welcome, {user?.name}
          </h2>
          <p className="text-muted mb-0">{dashboardData.school?.name || 'Parent Dashboard'}</p>
        </div>

        {/* Notifications */}
        {dashboardData.notifications.length > 0 && (
          <div className="alert alert-info rounded-4 mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-bell-fill me-3" style={{ fontSize: '1.5rem' }}></i>
              <div className="flex-grow-1">
                <strong className="d-block mb-2">New Notifications</strong>
                {dashboardData.notifications.slice(0, 3).map((notif, idx) => (
                  <div key={idx} className="mb-1"><i className="bi bi-dot"></i> {notif.message}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-primary bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-primary small">My Children</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.totalChildren}</p>
                </div>
                <i className="bi bi-people-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-success bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-success small">Total Results</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.totalResults}</p>
                </div>
                <i className="bi bi-file-earmark-text-fill text-success" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-info bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-info small">Avg Performance</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.avgPerformance}%</p>
                </div>
                <i className="bi bi-graph-up-arrow text-info" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm rounded-4 p-3 bg-warning bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-1 text-warning small">New Results</h6>
                  <p className="fs-3 fw-bold text-dark mb-0">{dashboardData.notifications.length}</p>
                </div>
                <i className="bi bi-bell-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Children Cards */}
        <div className="card shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-4">
            <i className="bi bi-person-hearts me-2 text-primary"></i>
            My Children
          </h5>

          {dashboardData.children.length === 0 ? (
            <div className="alert alert-info rounded-3">
              <i className="bi bi-info-circle me-2"></i>
              No children linked to your account. Please contact the school admin.
            </div>
          ) : (
            <div className="row g-3">
              {dashboardData.children.map(child => (
                <div key={child._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm rounded-3 h-100">
                    <div className="card-body p-3">

                      {/* Avatar + info */}
                      <div className="d-flex align-items-center mb-3">
                        {/* Show passport if uploaded, icon otherwise */}
                        {child.passportBase64 ? (
                          <img
                            src={child.passportBase64}
                            alt={child.name}
                            className="rounded-circle me-3 object-fit-cover"
                            style={{ width: 50, height: 50, objectFit: 'cover', border: '2px solid #0d6efd' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                            style={{ width: 50, height: 50, flexShrink: 0 }}
                          >
                            <i className="bi bi-person-fill text-primary" style={{ fontSize: '1.5rem' }}></i>
                          </div>
                        )}
                        <div className="flex-grow-1 min-width-0">
                          <h6 className="fw-bold mb-0 text-truncate">{child.name}</h6>
                          <small className="text-muted">{child.regNo}</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="badge bg-info me-2">{child.classId?.name || 'N/A'}</span>
                        {child.passportBase64
                          ? <span className="badge bg-success"><i className="bi bi-camera-fill me-1"></i>Photo uploaded</span>
                          : <span className="badge bg-secondary"><i className="bi bi-camera me-1"></i>No photo</span>
                        }
                      </div>

                      {/* Action buttons */}
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3 flex-grow-1"
                          onClick={() => navigate(`/parent/children/${child._id}/results`)}
                        >
                          <i className="bi bi-file-earmark-text me-1"></i>Results
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success rounded-3 flex-grow-1"
                          onClick={() => navigate(`/parent/children/${child._id}/analytics`)}
                        >
                          <i className="bi bi-graph-up me-1"></i>Analytics
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-3 flex-grow-1"
                          onClick={() => openUploadModal(child)}
                          title="Upload passport photo for result sheet"
                        >
                          <i className="bi bi-camera me-1"></i>Photo
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        {dashboardData.recentResults.length > 0 && (
          <div className="card shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-clock-history me-2 text-success"></i>
              Recent Results
            </h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small">Student</th>
                    <th className="small">Class</th>
                    <th className="small">Term/Session</th>
                    <th className="small">Average</th>
                    <th className="small">Grade</th>
                    <th className="small text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentResults.map(result => (
                    <tr key={result._id}>
                      <td>
                        <div className="fw-semibold small">{result.student.name}</div>
                        <small className="text-muted">{result.student.regNo}</small>
                      </td>
                      <td><span className="badge bg-info">{result.classId.name}</span></td>
                      <td className="small">
                        {result.term}<br />
                        <small className="text-muted">{result.session}</small>
                      </td>
                      <td className="fw-bold">{result.overallAverage}%</td>
                      <td>
                        <span className={`badge bg-${
                          result.overallGrade === 'A' ? 'success' :
                          result.overallGrade === 'B' ? 'primary' :
                          result.overallGrade === 'C' ? 'info'    :
                          result.overallGrade === 'D' ? 'warning' : 'danger'
                        }`}>{result.overallGrade}</span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/parent/results/${result._id}`)}
                        >
                          <i className="bi bi-eye me-1"></i>View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Passport Upload Modal ──────────────────────────────────────────────── */}
      {uploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content rounded-4 border-0 shadow-lg">

              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-camera-fill me-2 text-primary"></i>
                  Upload Passport Photo
                </h5>
                <button className="btn-close" onClick={closeUploadModal} disabled={uploading} />
              </div>

              <div className="modal-body pt-2">
                <p className="text-muted small mb-3">
                  For <strong>{uploadModal.name}</strong>. This photo will appear on their result sheet.
                </p>

                {/* Preview */}
                <div className="text-center mb-3">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt="Preview"
                      className="rounded-3 shadow-sm"
                      style={{ width: 140, height: 160, objectFit: 'cover', border: '2px solid #0d6efd' }}
                    />
                  ) : (
                    <div
                      className="rounded-3 bg-light d-flex flex-column align-items-center justify-content-center mx-auto"
                      style={{ width: 140, height: 160, border: '2px dashed #ccc', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-person-bounding-box text-muted" style={{ fontSize: '3rem' }}></i>
                      <small className="text-muted mt-1">Click to select</small>
                    </div>
                  )}
                </div>

                {/* File input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="d-none"
                  onChange={handleFileChange}
                />

                <button
                  className="btn btn-outline-secondary rounded-3 w-100 mb-3"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <i className="bi bi-folder2-open me-2"></i>
                  {previewSrc ? 'Choose a different photo' : 'Choose photo'}
                </button>

                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                  JPEG or PNG only · Max 2 MB · Passport-style photo recommended
                </p>

                {/* Message */}
                {uploadMsg.text && (
                  <div className={`alert alert-${uploadMsg.type === 'success' ? 'success' : 'danger'} py-2 small rounded-3`}>
                    {uploadMsg.text}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary rounded-3" onClick={closeUploadModal} disabled={uploading}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary rounded-3"
                  onClick={handleUpload}
                  disabled={uploading || !previewSrc || previewSrc === uploadModal.passportBase64}
                >
                  {uploading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</>
                    : <><i className="bi bi-cloud-upload me-2"></i>Save Photo</>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default ParentDashboard;