// src/components/Admin/TemplateBuilder.js
// Manual template builder for creating result sheet templates

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Save, Plus, Trash2, Edit2, Check, X, 
  ZoomIn, ZoomOut, RotateCcw, Move, Square 
} from 'lucide-react';
import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

const FIELD_CATEGORIES = [
  { value: 'student_info', label: 'Student Info', color: '#007bff' },
  { value: 'scores', label: 'Scores', color: '#28a745' },
  { value: 'affective', label: 'Affective Traits', color: '#ffc107' },
  { value: 'fees', label: 'Fees', color: '#dc3545' },
  { value: 'attendance', label: 'Attendance', color: '#17a2b8' },
  { value: 'comments', label: 'Comments', color: '#6c757d' },
  { value: 'other', label: 'Other', color: '#6610f2' }
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'table', label: 'Table Cell' }
];

const TemplateBuilder = ({ schoolId, token, onClose, existingTemplate = null }) => {
  const [templateName, setTemplateName] = useState('');
  const [term, setTerm] = useState('First Term');
  const [session, setSession] = useState('');
  const [templateImage, setTemplateImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState('select'); // 'select' or 'draw'
  const [editingLabel, setEditingLabel] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Load existing template if provided
  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.name);
      setTerm(existingTemplate.term);
      setSession(existingTemplate.session);
      setTemplateImage(existingTemplate.templateImage);
      
      // Flatten all fields from layout
      const allFields = [];
      const layout = existingTemplate.layout;
      
      // Extract fields from different sections
      if (layout.studentInfo) {
        Object.entries(layout.studentInfo).forEach(([key, field]) => {
          if (field && field.coordinates) {
            allFields.push({
              id: `student_${key}`,
              label: field.label,
              type: field.type,
              category: 'student_info',
              ...field.coordinates,
              isEditable: field.isEditable
            });
          }
        });
      }
      
      // Add more sections as needed
      setFields(allFields);
    }
  }, [existingTemplate]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setTemplateImage(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Get scale factor for display
  const getScale = () => {
    if (!containerRef.current || !imageDimensions.width) return 1;
    const containerWidth = containerRef.current.clientWidth - 40;
    return Math.min((containerWidth / imageDimensions.width) * zoom, 2);
  };

  const scale = getScale();

  // Mouse handlers for drawing boxes
  const handleMouseDown = (e) => {
    if (mode !== 'draw') return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || mode !== 'draw') return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    setCurrentBox({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(x - drawStart.x),
      height: Math.abs(y - drawStart.y)
    });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || mode !== 'draw') return;
    
    if (currentBox && currentBox.width > 10 && currentBox.height > 10) {
      const newField = {
        id: `field_${Date.now()}`,
        label: 'New Field',
        type: 'text',
        category: 'other',
        x: Math.round(currentBox.x),
        y: Math.round(currentBox.y),
        width: Math.round(currentBox.width),
        height: Math.round(currentBox.height),
        isEditable: true,
        isRequired: false
      };
      
      setFields([...fields, newField]);
      setSelectedField(newField.id);
      setEditingLabel(newField.id);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentBox(null);
    setMode('select');
  };

  // Update field properties
  const updateField = (fieldId, updates) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  // Delete field
  const deleteField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) setSelectedField(null);
  };

  // Move field
  const moveField = (fieldId, dx, dy) => {
    updateField(fieldId, {
      x: Math.max(0, fields.find(f => f.id === fieldId).x + dx),
      y: Math.max(0, fields.find(f => f.id === fieldId).y + dy)
    });
  };

  // Resize field
  const resizeField = (fieldId, edge, delta) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    let updates = {};
    
    if (edge.includes('right')) {
      updates.width = Math.max(20, field.width + delta.x);
    }
    if (edge.includes('bottom')) {
      updates.height = Math.max(20, field.height + delta.y);
    }
    if (edge.includes('left')) {
      updates.x = field.x + delta.x;
      updates.width = Math.max(20, field.width - delta.x);
    }
    if (edge.includes('top')) {
      updates.y = field.y + delta.y;
      updates.height = Math.max(20, field.height - delta.y);
    }
    
    updateField(fieldId, updates);
  };

  // Save template to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      if (!templateName || !term || !session || !templateImage) {
        setError('Please fill all required fields');
        return;
      }
      
      if (fields.length === 0) {
        setError('Please add at least one field to the template');
        return;
      }
      
      // Organize fields by category
      const layout = {
        header: {},
        studentInfo: {},
        scoresTable: { headers: [], startY: 0, rowHeight: 30, subjectColumn: { x: 0, width: 0 } },
        affective: { traits: [] },
        fees: { fields: [] },
        attendance: {},
        comments: {},
        signatures: {},
        customFields: []
      };
      
      fields.forEach(field => {
        const fieldData = {
          label: field.label,
          type: field.type,
          coordinates: {
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height
          },
          isEditable: field.isEditable,
          isRequired: field.isRequired,
          category: field.category
        };
        
        // Categorize fields
        if (field.category === 'student_info') {
          const key = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          layout.studentInfo[key] = fieldData;
        } else if (field.category === 'scores') {
          // Detect if it's a subject column or score column
          if (field.label.toLowerCase().includes('subject')) {
            layout.scoresTable.subjectColumn = { x: field.x, width: field.width };
            layout.scoresTable.startY = field.y;
          } else {
            layout.scoresTable.headers.push({
              name: field.label,
              coordinates: fieldData.coordinates
            });
          }
        } else if (field.category === 'affective') {
          layout.affective.traits.push({
            name: field.label,
            field: fieldData
          });
        } else if (field.category === 'fees') {
          layout.fees.fields.push({
            name: field.label,
            field: fieldData
          });
        } else if (field.category === 'attendance') {
          const key = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          layout.attendance[key] = fieldData;
        } else if (field.category === 'comments') {
          const key = field.label.toLowerCase().includes('principal') ? 'principal' : 'teacher';
          layout.comments[key] = fieldData;
        } else {
          layout.customFields.push(fieldData);
        }
      });
      
      const payload = {
        schoolId,
        name: templateName,
        term,
        session,
        templateImage,
        layout
      };
      
      const url = existingTemplate 
        ? `${REACT_APP_API_URL}/api/admin/templates/${existingTemplate._id}`
        : `${REACT_APP_API_URL}/api/admin/templates`;
      
      const method = existingTemplate ? 'put' : 'post';
      
      const res = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(res.data.message || 'Template saved successfully!');
      if (onClose) onClose();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category) => {
    return FIELD_CATEGORIES.find(c => c.value === category)?.color || '#6610f2';
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4>
              {existingTemplate ? 'Edit' : 'Create'} Result Template
            </h4>
            <button className="btn btn-outline-secondary" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Template Info */}
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Template Name *</label>
          <input
            type="text"
            className="form-control"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Primary 3 Result Sheet"
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Term *</label>
          <select className="form-select" value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Session *</label>
          <input
            type="text"
            className="form-control"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="e.g., 2024/2025"
          />
        </div>
      </div>

      {/* Image Upload */}
      {!templateImage && (
        <div className="card mb-3">
          <div className="card-body text-center py-5">
            <Upload size={48} className="text-muted mb-3" />
            <h5>Upload Result Sheet Template</h5>
            <p className="text-muted">Upload a blank result sheet image to start mapping fields</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="form-control w-50 mx-auto"
            />
          </div>
        </div>
      )}

      {templateImage && (
        <>
          {/* Toolbar */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <div className="btn-group w-100">
                    <button
                      className={`btn ${mode === 'select' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setMode('select')}
                    >
                      <Move size={16} className="me-1" />
                      Select
                    </button>
                    <button
                      className={`btn ${mode === 'draw' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setMode('draw')}
                    >
                      <Square size={16} className="me-1" />
                      Draw Box
                    </button>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="btn-group w-100">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                      <ZoomOut size={16} />
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setZoom(1)}>
                      <RotateCcw size={16} /> {Math.round(zoom * 100)}%
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="col-md-6 text-end">
                  <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                    <Save size={18} className="me-1" />
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
              
              <div className="alert alert-info mt-3 mb-0 small">
                <strong>Instructions:</strong> 
                {mode === 'draw' 
                  ? ' Click and drag on the image to draw a box around each input field.'
                  : ' Click on existing boxes to select and edit them. Use arrow keys to move selected box.'}
              </div>
            </div>
          </div>

          <div className="row">
            {/* Canvas Area */}
            <div className="col-md-9">
              <div 
                ref={containerRef}
                className="border rounded bg-light p-3"
                style={{ minHeight: '600px', maxHeight: '80vh', overflow: 'auto' }}
              >
                <div 
                  className="position-relative mx-auto"
                  style={{
                    width: imageDimensions.width * scale,
                    height: imageDimensions.height * scale,
                    cursor: mode === 'draw' ? 'crosshair' : 'default'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* Template Image */}
                  <img
                    ref={imageRef}
                    src={templateImage}
                    alt="Template"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />

                  {/* Existing Fields */}
                  {fields.map(field => (
                    <div
                      key={field.id}
                      className={`position-absolute ${selectedField === field.id ? 'border-primary' : ''}`}
                      style={{
                        left: field.x * scale,
                        top: field.y * scale,
                        width: field.width * scale,
                        height: field.height * scale,
                        border: `2px solid ${getCategoryColor(field.category)}`,
                        backgroundColor: selectedField === field.id ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.3)',
                        cursor: mode === 'select' ? 'move' : 'default',
                        boxSizing: 'border-box'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === 'select') {
                          setSelectedField(field.id);
                        }
                      }}
                    >
                      {editingLabel === field.id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          onBlur={() => setEditingLabel(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingLabel(null);
                          }}
                          autoFocus
                          style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}
                        />
                      ) : (
                        <div 
                          className="text-center small fw-bold"
                          style={{ 
                            fontSize: `${Math.max(10, 12 * scale)}px`,
                            padding: '2px',
                            color: getCategoryColor(field.category),
                            wordBreak: 'break-word'
                          }}
                        >
                          {field.label}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Current Drawing Box */}
                  {currentBox && isDrawing && (
                    <div
                      className="position-absolute border-success"
                      style={{
                        left: currentBox.x * scale,
                        top: currentBox.y * scale,
                        width: currentBox.width * scale,
                        height: currentBox.height * scale,
                        border: '2px dashed #28a745',
                        backgroundColor: 'rgba(40,167,69,0.1)'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="col-md-3">
              <div className="card sticky-top" style={{ top: '20px' }}>
                <div className="card-header">
                  <h6 className="mb-0">
                    {selectedField ? 'Edit Field' : 'Fields'}
                    <span className="badge bg-secondary ms-2">{fields.length}</span>
                  </h6>
                </div>
                <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {selectedField ? (
                    <>
                      {/* Edit Selected Field */}
                      {(() => {
                        const field = fields.find(f => f.id === selectedField);
                        if (!field) return null;
                        
                        return (
                          <div>
                            <div className="mb-3">
                              <label className="form-label small">Label</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                              />
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label small">Type</label>
                              <select
                                className="form-select form-select-sm"
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value })}
                              >
                                {FIELD_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label small">Category</label>
                              <select
                                className="form-select form-select-sm"
                                value={field.category}
                                onChange={(e) => updateField(field.id, { category: e.target.value })}
                              >
                                {FIELD_CATEGORIES.map(c => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="row mb-3">
                              <div className="col-6">
                                <label className="form-label small">X</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={field.x}
                                  onChange={(e) => updateField(field.id, { x: Number(e.target.value) })}
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label small">Y</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={field.y}
                                  onChange={(e) => updateField(field.id, { y: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            
                            <div className="row mb-3">
                              <div className="col-6">
                                <label className="form-label small">Width</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={field.width}
                                  onChange={(e) => updateField(field.id, { width: Number(e.target.value) })}
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label small">Height</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={field.height}
                                  onChange={(e) => updateField(field.id, { height: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            
                            <div className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={field.isEditable}
                                onChange={(e) => updateField(field.id, { isEditable: e.target.checked })}
                                id="editable"
                              />
                              <label className="form-check-label small" htmlFor="editable">
                                Editable by teachers
                              </label>
                            </div>
                            
                            <div className="form-check mb-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={field.isRequired}
                                onChange={(e) => updateField(field.id, { isRequired: e.target.checked })}
                                id="required"
                              />
                              <label className="form-check-label small" htmlFor="required">
                                Required field
                              </label>
                            </div>
                            
                            <div className="d-grid gap-2">
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteField(field.id)}
                              >
                                <Trash2 size={14} className="me-1" />
                                Delete Field
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSelectedField(null)}
                              >
                                Deselect
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      {/* Fields List */}
                      <div className="small text-muted mb-2">
                        Click a field to edit or click "Draw Box" to add new fields
                      </div>
                      
                      {FIELD_CATEGORIES.map(category => {
                        const categoryFields = fields.filter(f => f.category === category.value);
                        if (categoryFields.length === 0) return null;
                        
                        return (
                          <div key={category.value} className="mb-3">
                            <div 
                              className="small fw-bold mb-1"
                              style={{ color: category.color }}
                            >
                              {category.label} ({categoryFields.length})
                            </div>
                            {categoryFields.map(field => (
                              <div
                                key={field.id}
                                className="border-start ps-2 mb-1 small"
                                style={{ 
                                  borderColor: category.color + ' !important',
                                  borderWidth: '3px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setSelectedField(field.id)}
                              >
                                {field.label}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      
                      {fields.length === 0 && (
                        <div className="text-center text-muted py-4">
                          <Square size={32} className="mb-2" />
                          <div className="small">No fields added yet</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateBuilder;