// src/components/Admin/TemplateManager.jsx
// Lists all result templates. Only ONE can be active at a time.
// Bootstrap 5 only — no external icon library required.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import VisualTemplateBuilder from './VisualTemplateBuilder';

const { REACT_APP_API_URL } = process.env;

const TemplateManager = () => {
  const token   = localStorage.getItem('accessToken');
  const authHdr = () => `Bearer ${token}`;

  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [actionId,  setActionId]  = useState(null);
  const [creating,  setCreating]  = useState(false);
  const [editing,   setEditing]   = useState(null);

  // ── Load templates ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/templates`, {
        headers: { Authorization: authHdr() },
      });
      setTemplates(res.data.templates || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  // ── Activate ─────────────────────────────────────────────────────────────────
  const activate = async (id) => {
    setActionId(id);
    setError('');
    try {
      await axios.patch(
        `${REACT_APP_API_URL}/api/admin/templates/${id}/activate`,
        {},
        { headers: { Authorization: authHdr() } }
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to activate template.');
    } finally {
      setActionId(null);
    }
  };

  // ── Deactivate ────────────────────────────────────────────────────────────────
  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this template? Teachers will see "no active term" until another is activated.')) return;
    setActionId(id);
    setError('');
    try {
      await axios.put(
        `${REACT_APP_API_URL}/api/admin/templates/${id}`,
        { isActive: false },
        { headers: { Authorization: authHdr() } }
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to deactivate template.');
    } finally {
      setActionId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const del = async (t) => {
    const warn = t.isActive
      ? `"${t.name}" is the ACTIVE template. Deleting it means teachers will see no active term. Continue?`
      : `Permanently delete "${t.name}"? This cannot be undone.`;
    if (!window.confirm(warn)) return;
    setActionId(t._id);
    setError('');
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/admin/templates/${t._id}`, {
        headers: { Authorization: authHdr() },
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete template.');
    } finally {
      setActionId(null);
    }
  };

  // ── Open builder ──────────────────────────────────────────────────────────────
  if (creating) {
    return (
      <VisualTemplateBuilder
        token={token}
        onClose={() => { setCreating(false); load(); }}
      />
    );
  }

  if (editing) {
    return (
      <VisualTemplateBuilder
        token={token}
        existingTemplate={editing}
        onClose={() => { setEditing(null); load(); }}
      />
    );
  }

  const active = templates.find(t => t.isActive);

  const fmtDate = (d) => {
    if (!d) return null;
    const parts = d.split('-');
    if (parts.length === 3) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
    }
    return d;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid px-3 py-4" style={{ maxWidth: 860 }}>

      {/* ── Header ── */}
      <div className="d-flex align-items-start justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <h5 className="fw-bold mb-1">Result Templates</h5>
          <p className="text-muted small mb-0">
            Only one template can be active at a time. The active template sets the term and
            session for all teachers automatically.
          </p>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={load}
            disabled={loading}
          >
            {loading
              ? <span className="spinner-border spinner-border-sm me-1" />
              : <span className="me-1">↻</span>
            }
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setCreating(true)}
          >
            + New Template
          </button>
        </div>
      </div>

      {/* ── Active term banner ── */}
      {active ? (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-4">
          <span className="fs-5">✅</span>
          <div>
            Active term: <strong>{active.term}</strong> &middot; <strong>{active.session}</strong>
            {active.components?.termBegins && (
              <> &middot; Begins: <strong>{fmtDate(active.components.termBegins)}</strong></>
            )}
            {active.components?.termEnds && (
              <> &middot; Ends: <strong>{fmtDate(active.components.termEnds)}</strong></>
            )}
            {active.components?.nextTermBegins && (
              <> &middot; Next term: <strong>{fmtDate(active.components.nextTermBegins)}</strong></>
            )}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-4">
          <span className="fs-5">⚠️</span>
          <span>No active template. Teachers cannot enter scores until one is activated.</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-danger alert-dismissible py-2 mb-3">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {/* ── Template list ── */}
      {loading && templates.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 small">Loading templates…</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <p className="text-muted mb-3">No templates yet.</p>
          <div>
            <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
              + Create First Template
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {templates.map(t => {
            const busy = actionId === t._id;
            return (
              <div
                key={t._id}
                className="card border-0 shadow-sm"
                style={{ borderLeft: `4px solid ${t.isActive ? '#198754' : '#dee2e6'}` }}
              >
                <div className="card-body py-3 px-3">
                  <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">

                    {/* Info */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fw-bold">{t.name}</span>
                        {t.isActive
                          ? <span className="badge bg-success">Active</span>
                          : <span className="badge bg-secondary">Inactive</span>
                        }
                      </div>
                      <div className="text-muted small mb-1">
                        <span className="me-3">{t.term} · {t.session}</span>
                        {t.components?.subjects?.length > 0 && (
                          <span className="me-3">{t.components.subjects.length} subjects</span>
                        )}
                        {t.components?.termBegins && (
                          <span className="me-3">Begins: {fmtDate(t.components.termBegins)}</span>
                        )}
                        {t.components?.termEnds && (
                          <span className="me-3">Ends: {fmtDate(t.components.termEnds)}</span>
                        )}
                        {t.components?.nextTermBegins && (
                          <span>Next: {fmtDate(t.components.nextTermBegins)}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11 }} className="text-muted">
                        Created {new Date(t.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                        {t.createdBy?.name && ` · by ${t.createdBy.name}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2 flex-shrink-0 flex-wrap align-items-center">

                      {t.isActive ? (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => deactivate(t._id)}
                          disabled={busy}
                        >
                          {busy
                            ? <span className="spinner-border spinner-border-sm" />
                            : 'Deactivate'
                          }
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => activate(t._id)}
                          disabled={busy}
                        >
                          {busy
                            ? <><span className="spinner-border spinner-border-sm me-1" />Activating…</>
                            : '✓ Activate'
                          }
                        </button>
                      )}

                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setEditing(t)}
                        disabled={busy}
                      >
                        Edit
                      </button>

                      <button
                        className={`btn btn-sm ${t.isActive ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => del(t)}
                        disabled={busy}
                        title={t.isActive ? 'Deleting active template!' : 'Delete'}
                      >
                        🗑
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TemplateManager;