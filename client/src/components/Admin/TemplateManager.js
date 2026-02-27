// src/components/Admin/TemplateManager.jsx
// Lists all result templates. Only ONE can be active at a time.
// Admin can activate, deactivate, delete, or open for editing.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, CheckCircle, XCircle, Trash2, Edit, AlertTriangle, RefreshCw } from 'lucide-react';
import VisualTemplateBuilder from './VisualTemplateBuilder';

const { REACT_APP_API_URL } = process.env;

const TemplateManager = () => {
  const token     = localStorage.getItem('accessToken');
  const authHdr   = () => `Bearer ${token}`;

  const [templates,  setTemplates]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [actionId,   setActionId]   = useState(null); // which template is mid-action
  const [creating,   setCreating]   = useState(false);
  const [editing,    setEditing]    = useState(null); // template being edited

  // ── Load all templates ───────────────────────────────────────────────────
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
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Activate ─────────────────────────────────────────────────────────────
  const activate = async (id) => {
    setActionId(id);
    try {
      await axios.patch(`${REACT_APP_API_URL}/api/admin/templates/${id}/activate`, {}, {
        headers: { Authorization: authHdr() },
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to activate template.');
    } finally {
      setActionId(null);
    }
  };

  // ── Deactivate ───────────────────────────────────────────────────────────
  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this template? Teachers will see "no active term" until another is activated.')) return;
    setActionId(id);
    try {
      await axios.put(`${REACT_APP_API_URL}/api/admin/templates/${id}`, { isActive: false }, {
        headers: { Authorization: authHdr() },
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to deactivate template.');
    } finally {
      setActionId(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const del = async (t) => {
    const warn = t.isActive
      ? `Delete the ACTIVE template "${t.name}"? Teachers will see no active term until another is activated.`
      : `Permanently delete "${t.name}"? This cannot be undone.`;
    if (!window.confirm(warn)) return;
    setActionId(t._id);
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

  // ── Builder open/close ────────────────────────────────────────────────────
  if (creating) return (
    <VisualTemplateBuilder
      token={token}
      onClose={() => { setCreating(false); load(); }}
    />
  );

  if (editing) return (
    <VisualTemplateBuilder
      token={token}
      existingTemplate={editing}
      onClose={() => { setEditing(null); load(); }}
    />
  );

  // ── Active template banner ────────────────────────────────────────────────
  const active = templates.find(t => t.isActive);

  return (
    <div className="container-fluid px-3 py-4" style={{ maxWidth: 900 }}>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-0">Result Templates</h5>
          <p className="text-muted small mb-0">Only one template can be active at a time. The active template sets the term and session for all teachers.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setCreating(true)}>
            <Plus size={14} /> New Template
          </button>
        </div>
      </div>

      {/* Active term banner */}
      {active ? (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2">
          <CheckCircle size={18} className="flex-shrink-0" />
          <span>
            Active term: <strong>{active.term}</strong> · <strong>{active.session}</strong>
            {active.components?.termBegins && <> · Term begins: <strong>{active.components.termBegins}</strong></>}
            {active.components?.termEnds   && <> · Ends: <strong>{active.components.termEnds}</strong></>}
          </span>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4 py-2">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>No active template. Teachers cannot enter scores or view results until one is activated.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger alert-dismissible py-2 mb-3">
          {error}
          <button className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5 text-muted">
          <p className="mb-3">No templates yet.</p>
          <button className="btn btn-primary btn-sm mx-auto" style={{ width: 'fit-content' }} onClick={() => setCreating(true)}>
            <Plus size={14} className="me-1" /> Create First Template
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {templates.map(t => {
            const busy = actionId === t._id;
            return (
              <div key={t._id} className={`card border-0 shadow-sm ${t.isActive ? 'border-success' : ''}`}
                style={{ borderLeft: `4px solid ${t.isActive ? '#198754' : '#dee2e6'}` }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">

                    {/* Info */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span className="fw-bold">{t.name}</span>
                        {t.isActive
                          ? <span className="badge bg-success">Active</span>
                          : <span className="badge bg-secondary">Inactive</span>
                        }
                      </div>
                      <div className="text-muted small">
                        <span className="me-3">{t.term} · {t.session}</span>
                        {t.components?.subjects?.length > 0 && (
                          <span className="me-3">{t.components.subjects.length} subjects</span>
                        )}
                        {t.components?.termBegins && <span className="me-3">Begins: {t.components.termBegins}</span>}
                        {t.components?.termEnds   && <span className="me-3">Ends: {t.components.termEnds}</span>}
                        {t.components?.nextTermBegins && <span>Next term: {t.components.nextTermBegins}</span>}
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>
                        Created {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {t.createdBy?.name && ` by ${t.createdBy.name}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2 flex-shrink-0 flex-wrap">
                      {/* Activate / Deactivate */}
                      {t.isActive ? (
                        <button
                          className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                          onClick={() => deactivate(t._id)}
                          disabled={busy}
                          title="Deactivate this template"
                        >
                          {busy ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={14} />}
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                          onClick={() => activate(t._id)}
                          disabled={busy}
                          title="Set as active template"
                        >
                          {busy ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle size={14} />}
                          Activate
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        onClick={() => setEditing(t)}
                        disabled={busy}
                      >
                        <Edit size={14} /> Edit
                      </button>

                      {/* Delete */}
                      <button
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                        onClick={() => del(t)}
                        disabled={busy}
                        title={t.isActive ? 'Delete active template' : 'Delete template'}
                      >
                        {busy ? <span className="spinner-border spinner-border-sm" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note for developer */}
      <div className="mt-4 p-3 bg-light rounded border small text-muted">
        <strong>Route to wire:</strong> Add to your admin router:
        <code className="d-block mt-1">router.patch('/templates/:id/activate', authenticate, isAdmin, activateResultTemplate);</code>
        Import <code>activateResultTemplate</code> from <code>adminResultController.js</code>.
      </div>
    </div>
  );
};

export default TemplateManager;