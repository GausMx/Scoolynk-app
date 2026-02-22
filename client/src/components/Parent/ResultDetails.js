// src/components/Parent/ResultDetails.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../common/Layout';
import Loading from '../common/Loading';
import NigerianResultSheet from '../common/NigerianResultSheet';
import { getUser } from '../utils/auth';

const { REACT_APP_API_URL } = process.env;

const ResultDetails = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const token = localStorage.getItem('accessToken');
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResultDetails();
  }, [resultId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      setLoadingPercent(10);

      const res = await axios.get(
        `${REACT_APP_API_URL}/api/parent/results/${resultId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLoadingPercent(70);
      setResult(res.data.result);
      setLoadingPercent(100);
    } catch (err) {
      console.error('Failed to fetch result details:', err);
      setError('Failed to load result. Please try again.');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // ── Download PDF (server-generated Nigerian sheet) ──────────────────────────
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const downloadUrl = `${REACT_APP_API_URL}/api/results/download/${resultId}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  // ── Browser print (uses the NigerianResultSheet @media print styles) ────────
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loading percentage={loadingPercent} />;

  if (!result) {
    return (
      <Layout user={user} role="parent">
        <div className="container py-5" style={{ paddingTop: '140px' }}>
          <div className="alert alert-danger rounded-3">
            {error || 'Result not found.'}
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </Layout>
    );
  }

  // ── Map result → NigerianResultSheet props ───────────────────────────────────
  const schoolProps = {
    name:         result.schoolId?.name,
    motto:        result.schoolId?.motto,
    address:      result.schoolId?.address,
    phone:        result.schoolId?.phone,
    email:        result.schoolId?.email,
    logoBase64:   result.schoolId?.logoBase64,
  };

  const studentProps = {
    name:          result.student?.name,
    admNo:         result.student?.regNo,
    gender:        result.student?.gender,
    dob:           result.student?.dob
      ? new Date(result.student.dob).toLocaleDateString('en-GB')
      : '',
    className:     result.classId?.name,
    passportBase64: result.student?.passportBase64,
    club:          result.student?.club,
  };

  return (
    <Layout user={user} role="parent">
      {/* ── Action bar (hidden on print) ─────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: '#fff', borderBottom: '1px solid #dee2e6',
          padding: '10px 20px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-sm btn-outline-secondary rounded-3"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <span className="fw-semibold" style={{ fontSize: '14px' }}>
            {result.student?.name} — {result.term}, {result.session}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-sm btn-outline-primary rounded-3"
            onClick={handlePrint}
          >
            🖨️ Print
          </button>
          <button
            className="btn btn-sm btn-success rounded-3"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <span className="spinner-border spinner-border-sm me-1" />
            ) : (
              <span>⬇ </span>
            )}
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Result Sheet ──────────────────────────────────────────────────────── */}
      <div
        style={{
          paddingTop: '24px',
          paddingBottom: '40px',
          backgroundColor: '#f0f0f0',
          minHeight: '100vh',
        }}
      >
        {/* Centred white card wrapper (screen only) */}
        <div
          className="no-print"
          style={{ maxWidth: '820px', margin: '0 auto', padding: '0 12px' }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <NigerianResultSheet
              result={result}
              school={schoolProps}
              student={studentProps}
              classSize={result.classSize || 0}
              nextTermBegins={
                result.nextTermResumption
                  ? new Date(result.nextTermResumption).toLocaleDateString('en-GB', {
                      weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
                    })
                  : ''
              }
              termBegins={
                result.termBegins
                  ? new Date(result.termBegins).toLocaleDateString('en-GB')
                  : ''
              }
              termEnds={
                result.termEnds
                  ? new Date(result.termEnds).toLocaleDateString('en-GB')
                  : ''
              }
            />
          </div>
        </div>

        {/* Print-only version (no wrapper card) */}
        <div className="print-only">
          <NigerianResultSheet
            result={result}
            school={schoolProps}
            student={studentProps}
            classSize={result.classSize || 0}
            nextTermBegins={
              result.nextTermResumption
                ? new Date(result.nextTermResumption).toLocaleDateString('en-GB', {
                    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
                  })
                : ''
            }
            termBegins={
              result.termBegins
                ? new Date(result.termBegins).toLocaleDateString('en-GB')
                : ''
            }
            termEnds={
              result.termEnds
                ? new Date(result.termEnds).toLocaleDateString('en-GB')
                : ''
            }
          />
        </div>
      </div>

      {/* ── Global print styles ────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; margin: 0 !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
        @page { size: A4; margin: 8mm; }
      `}</style>
    </Layout>
  );
};

export default ResultDetails;