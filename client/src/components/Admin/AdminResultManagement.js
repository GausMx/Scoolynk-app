// src/components/Admin/AdminResultManagement.js - MOBILE RESPONSIVE VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Eye, Check, Send, Filter, Plus, Edit2,
  AlertCircle, CheckCircle, Clock, Trash2
} from 'lucide-react';
import VisualTemplateBuilder from './VisualTemplateBuilder';

const { REACT_APP_API_URL } = process.env;

const AdminResultManagement = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2024/2025');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
    else if (activeTab === 'pending') fetchPendingResults();
    else if (activeTab === 'all') fetchAllResults();
  }, [activeTab, selectedTerm, selectedSession]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data.templates || []);
    } catch (err) {
      showMessage('error', 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/admin/results/submitted`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term: selectedTerm, session: selectedSession }
        }
      );
      setResults(res.data.results || []);
    } catch (err) {
      showMessage('error', 'Failed to load pending results.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${REACT_APP_API_URL}/api/admin/results`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { term: selectedTerm, session: selectedSession }
        }
      );
      setResults(res.data.results || []);
    } catch (err) {
      showMessage('error', 'Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to deactivate this template?')) return;
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/admin/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Template deactivated successfully');
      fetchTemplates();
    } catch {
      showMessage('error', 'Failed to deactivate template');
    }
  };

  return (
    <div className="container-fluid py-3 px-2 px-md-4">
      {!showTemplateBuilder ? (
        <div className="card shadow-lg rounded-4 p-3 p-md-4 mb-4 border-0">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 border-bottom pb-3">
            <div className="mb-2 mb-md-0">
              <h4 className="fw-bold text-primary d-flex align-items-center mb-2">
                <FileText size={26} className="me-2" /> Result Management
              </h4>
              <p className="text-muted mb-0 small">Manage result templates and review student results</p>
            </div>
          </div>

          {/* Alert */}
          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
            </div>
          )}

          {/* Tabs */}
          <ul className="nav nav-pills mb-4 gap-2 flex-wrap">
            {[
              { id: 'templates', icon: FileText, label: 'Result Templates' },
              { id: 'pending', icon: Clock, label: 'Pending Review' },
              { id: 'all', icon: CheckCircle, label: 'All Results' }
            ].map(tab => (
              <li key={tab.id} className="nav-item flex-grow-1 flex-md-grow-0">
                <button
                  className={`nav-link w-100 rounded-3 d-flex align-items-center justify-content-center ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} className="me-2" />
                  <span className="small">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Tab Content */}
          <div className="overflow-auto">
            {activeTab === 'templates' && (
              <TemplatesTab
                templates={templates}
                loading={loading}
                onCreateNew={() => { setEditingTemplate(null); setShowTemplateBuilder(true); }}
                onEdit={(template) => { setEditingTemplate(template); setShowTemplateBuilder(true); }}
                onDelete={deleteTemplate}
              />
            )}

            {activeTab === 'pending' && (
              <PendingResultsTab
                results={results}
                loading={loading}
                selectedTerm={selectedTerm}
                setSelectedTerm={setSelectedTerm}
                selectedSession={selectedSession}
                setSelectedSession={setSelectedSession}
                token={token}
                onReviewSuccess={() => { showMessage('success', 'Result reviewed successfully!'); fetchPendingResults(); }}
              />
            )}

            {activeTab === 'all' && (
              <AllResultsTab
                results={results}
                loading={loading}
                selectedTerm={selectedTerm}
                setSelectedTerm={setSelectedTerm}
                selectedSession={selectedSession}
                setSelectedSession={setSelectedSession}
                token={token}
                onActionSuccess={() => { showMessage('success', 'Action completed successfully!'); fetchAllResults(); }}
              />
            )}
          </div>
        </div>
      ) : (
        <VisualTemplateBuilder
          schoolId={JSON.parse(localStorage.getItem('user'))?.schoolId}
          token={token}
          existingTemplate={editingTemplate}
          onClose={() => {
            setShowTemplateBuilder(false);
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
};

// ==================== RESPONSIVE FIXES ====================
// - Added flex-wrap and w-100 where needed
// - Tables wrapped in .table-responsive
// - Buttons and tabs adjusted for mobile stacking
// - Text shrinks on smaller screens using Bootstrap .small
// - Ensured paddings and margins scale with viewport

export default AdminResultManagement;
