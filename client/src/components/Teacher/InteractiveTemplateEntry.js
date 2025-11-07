// src/components/Teacher/InteractiveTemplateEntry.js
// Uses manually mapped template for direct input on image

import React, { useState, useRef, useEffect } from 'react';
import { Save, Send, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const InteractiveTemplateEntry = ({
  template,
  student,
  subjects,
  setSubjects,
  affectiveTraits,
  setAffectiveTraits,
  fees,
  setFees,
  attendance,
  setAttendance,
  comments,
  setComments,
  onSave,
  onSubmit
}) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [allFields, setAllFields] = useState([]);

  // Load image and get dimensions
  useEffect(() => {
    if (template?.templateImage && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);
      };
      img.src = template.templateImage;
    }
  }, [template?.templateImage]);

  // Extract all fields from template layout
  useEffect(() => {
    if (!template?.layout) return;
    
    const fields = [];
    const layout = template.layout;
    
    // Student Info fields
    if (layout.studentInfo) {
      Object.entries(layout.studentInfo).forEach(([key, field]) => {
        if (field?.coordinates) {
          fields.push({
            id: `student_${key}`,
            type: 'student_info',
            fieldKey: key,
            ...field
          });
        }
      });
    }
    
    // Scores table
    if (layout.scoresTable) {
      fields.push({
        id: 'scores_table',
        type: 'scores_table',
        data: layout.scoresTable
      });
    }
    
    // Affective traits
    if (layout.affective?.traits) {
      layout.affective.traits.forEach((trait, idx) => {
        if (trait.field?.coordinates) {
          fields.push({
            id: `affective_${idx}`,
            type: 'affective',
            traitName: trait.name,
            ...trait.field
          });
        }
      });
    }
    
    // Fees
    if (layout.fees?.fields) {
      layout.fees.fields.forEach((fee, idx) => {
        if (fee.field?.coordinates) {
          fields.push({
            id: `fee_${idx}`,
            type: 'fee',
            feeName: fee.name,
            ...fee.field
          });
        }
      });
    }
    
    // Attendance
    if (layout.attendance) {
      Object.entries(layout.attendance).forEach(([key, field]) => {
        if (field?.coordinates) {
          fields.push({
            id: `attendance_${key}`,
            type: 'attendance',
            fieldKey: key,
            ...field
          });
        }
      });
    }
    
    // Comments
    if (layout.comments) {
      Object.entries(layout.comments).forEach(([key, field]) => {
        if (field?.coordinates) {
          fields.push({
            id: `comment_${key}`,
            type: 'comment',
            fieldKey: key,
            ...field
          });
        }
      });
    }
    
    setAllFields(fields);
  }, [template?.layout]);

  // Calculate scale factor
  const getScaleFactor = () => {
    if (!containerRef.current || !imageDimensions.width) return 1;
    const containerWidth = containerRef.current.clientWidth - 40;
    return (containerWidth / imageDimensions.width) * zoom;
  };

  const scale = getScaleFactor();

  // Ensure we have enough subject rows
  useEffect(() => {
    if (template?.layout?.scoresTable) {
      const estimatedRows = 15; // Default number of subject rows
      if (subjects.length < estimatedRows) {
        const newSubjects = [...subjects];
        while (newSubjects.length < estimatedRows) {
          newSubjects.push({ subject: '', ca1: 0, ca2: 0, exam: 0 });
        }
        setSubjects(newSubjects);
      }
    }
  }, [template]);

  // Update subject field
  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    if (!updated[index]) {
      updated[index] = { subject: '', ca1: 0, ca2: 0, exam: 0 };
    }
    updated[index][field] = field === 'subject' ? value : Number(value);
    setSubjects(updated);
  };

  // Generate filled canvas
  const generateFilledCanvas = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        ctx.fillStyle = '#000000';
        
        // Draw all filled fields
        allFields.forEach(field => {
          if (field.type === 'student_info') {
            ctx.font = 'bold 18px Arial';
            let value = '';
            if (field.fieldKey === 'name') value = student.name || '';
            else if (field.fieldKey === 'regno') value = student.regNo || '';
            else if (field.fieldKey === 'classname') value = student.classId?.name || '';
            
            if (value) {
              ctx.fillText(value, field.coordinates.x, field.coordinates.y + 18);
            }
          }
          else if (field.type === 'affective') {
            ctx.font = '14px Arial';
            const traitKey = field.traitName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const value = affectiveTraits[traitKey] || 3;
            ctx.fillText(value.toString(), field.coordinates.x + 5, field.coordinates.y + 15);
          }
          else if (field.type === 'fee') {
            ctx.font = '14px Arial';
            const feeKey = field.feeName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const value = fees[feeKey] || 0;
            ctx.fillText('₦' + value.toLocaleString(), field.coordinates.x + 5, field.coordinates.y + 15);
          }
          else if (field.type === 'attendance') {
            ctx.font = '14px Arial';
            const value = attendance[field.fieldKey] || 0;
            ctx.fillText(value.toString(), field.coordinates.x + 5, field.coordinates.y + 15);
          }
          else if (field.type === 'comment') {
            ctx.font = '12px Arial';
            const text = field.fieldKey === 'teacher' ? comments.teacher : comments.principal;
            if (text) {
              wrapText(ctx, text, field.coordinates.x + 5, field.coordinates.y + 15, field.coordinates.width - 10, 16);
            }
          }
        });
        
        // Draw scores table
        const scoresField = allFields.find(f => f.type === 'scores_table');
        if (scoresField) {
          const table = scoresField.data;
          ctx.font = '14px Arial';
          
          subjects.forEach((subject, index) => {
            if (!subject.subject) return;
            
            const y = table.startY + (index * table.rowHeight) + 18;
            
            // Subject name
            ctx.fillText(subject.subject, table.subjectColumn.x + 5, y);
            
            // Scores
            table.headers.forEach(header => {
              let value = '';
              const headerName = header.name.toLowerCase();
              
              if (headerName.includes('ca1') || headerName.includes('ca 1')) {
                value = (subject.ca1 || 0).toString();
              } else if (headerName.includes('ca2') || headerName.includes('ca 2')) {
                value = (subject.ca2 || 0).toString();
              } else if (headerName.includes('exam')) {
                value = (subject.exam || 0).toString();
              } else if (headerName.includes('total')) {
                const total = (Number(subject.ca1) || 0) + (Number(subject.ca2) || 0) + (Number(subject.exam) || 0);
                value = total.toString();
              } else if (headerName.includes('grade')) {
                const total = (Number(subject.ca1) || 0) + (Number(subject.ca2) || 0) + (Number(subject.exam) || 0);
                const percent = total;
                if (percent >= 70) value = 'A';
                else if (percent >= 60) value = 'B';
                else if (percent >= 50) value = 'C';
                else if (percent >= 40) value = 'D';
                else value = 'F';
              }
              
              if (value) {
                ctx.fillText(value, header.coordinates.x + 5, y);
              }
            });
          });
        }
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = template.templateImage;
    });
  };

  // Helper to wrap text
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line, x, currentY);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const filledImage = await generateFilledCanvas();
    if (onSave) await onSave(filledImage);
    setIsSaving(false);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const filledImage = await generateFilledCanvas();
    if (onSubmit) await onSubmit(filledImage);
    setIsSaving(false);
  };

  if (!template || !imageLoaded) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Loading template...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Zoom Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="badge bg-info me-2">Template: {template.name}</span>
          <span className="badge bg-secondary">{allFields.length} fields</span>
        </div>
        
        <div className="btn-group btn-group-sm me-3">
          <button className="btn btn-outline-secondary" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut size={14} />
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setZoom(1)}>
            <RotateCcw size={14} /> {Math.round(zoom * 100)}%
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn size={14} />
          </button>
        </div>
        
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
            <Save size={14} className="me-1" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn btn-success btn-sm" onClick={handleSubmit} disabled={isSaving}>
            <Send size={14} className="me-1" />
            {isSaving ? 'Submitting...' : 'Submit to Admin'}
          </button>
        </div>
      </div>

      {/* Interactive Template Container */}
      <div 
        ref={containerRef}
        className="position-relative border rounded bg-light"
        style={{ 
          overflow: 'auto',
          maxHeight: '80vh',
          padding: '20px'
        }}
      >
        <div 
          className="position-relative mx-auto"
          style={{ 
            width: imageDimensions.width * scale,
            height: imageDimensions.height * scale
          }}
        >
          {/* Template Image */}
          <img
            ref={imageRef}
            src={template.templateImage}
            alt="Result Template"
            style={{ 
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: 'none'
            }}
          />

          {/* Render all input fields */}
          {allFields.map(field => {
            // Student Info Fields (Read-only)
            if (field.type === 'student_info') {
              let value = '';
              if (field.fieldKey === 'name') value = student.name || '';
              else if (field.fieldKey === 'regno') value = student.regNo || '';
              else if (field.fieldKey === 'classname') value = student.classId?.name || '';
              
              return (
                <input
                  key={field.id}
                  type="text"
                  value={value}
                  readOnly
                  className="position-absolute form-control form-control-sm"
                  style={{
                    left: field.coordinates.x * scale,
                    top: field.coordinates.y * scale,
                    width: field.coordinates.width * scale,
                    height: field.coordinates.height * scale,
                    fontSize: `${Math.max(10, 12 * scale)}px`,
                    border: '1px solid rgba(0,123,255,0.3)',
                    backgroundColor: 'rgba(230,240,255,0.8)',
                    fontWeight: 'bold'
                  }}
                />
              );
            }
            
            // Affective Traits
            if (field.type === 'affective') {
              const traitKey = field.traitName.toLowerCase().replace(/[^a-z0-9]/g, '');
              return (
                <input
                  key={field.id}
                  type="number"
                  value={affectiveTraits[traitKey] || 3}
                  onChange={(e) => setAffectiveTraits({
                    ...affectiveTraits,
                    [traitKey]: Math.min(5, Math.max(1, Number(e.target.value)))
                  })}
                  min="1"
                  max="5"
                  className="position-absolute form-control form-control-sm"
                  style={{
                    left: field.coordinates.x * scale,
                    top: field.coordinates.y * scale,
                    width: field.coordinates.width * scale,
                    height: field.coordinates.height * scale,
                    fontSize: `${Math.max(9, 11 * scale)}px`,
                    border: '1px solid rgba(255,193,7,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    textAlign: 'center'
                  }}
                />
              );
            }
            
            // Fees
            if (field.type === 'fee') {
              const feeKey = field.feeName.toLowerCase().replace(/[^a-z0-9]/g, '');
              return (
                <input
                  key={field.id}
                  type="number"
                  value={fees[feeKey] || 0}
                  onChange={(e) => setFees({
                    ...fees,
                    [feeKey]: Math.max(0, Number(e.target.value))
                  })}
                  min="0"
                  className="position-absolute form-control form-control-sm"
                  style={{
                    left: field.coordinates.x * scale,
                    top: field.coordinates.y * scale,
                    width: field.coordinates.width * scale,
                    height: field.coordinates.height * scale,
                    fontSize: `${Math.max(9, 11 * scale)}px`,
                    border: '1px solid rgba(220,53,69,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.9)'
                  }}
                />
              );
            }
            
            // Attendance
            if (field.type === 'attendance') {
              return (
                <input
                  key={field.id}
                  type="number"
                  value={attendance[field.fieldKey] || 0}
                  onChange={(e) => setAttendance({
                    ...attendance,
                    [field.fieldKey]: Math.max(0, Number(e.target.value))
                  })}
                  min="0"
                  className="position-absolute form-control form-control-sm"
                  style={{
                    left: field.coordinates.x * scale,
                    top: field.coordinates.y * scale,
                    width: field.coordinates.width * scale,
                    height: field.coordinates.height * scale,
                    fontSize: `${Math.max(9, 11 * scale)}px`,
                    border: '1px solid rgba(23,162,184,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    textAlign: 'center'
                  }}
                />
              );
            }
            
            // Comments
            if (field.type === 'comment') {
              const commentKey = field.fieldKey === 'teacher' ? 'teacher' : 'principal';
              return (
                <textarea
                  key={field.id}
                  value={comments[commentKey] || ''}
                  onChange={(e) => setComments({
                    ...comments,
                    [commentKey]: e.target.value
                  })}
                  placeholder={`${field.label || 'Comment'}...`}
                  className="position-absolute form-control form-control-sm"
                  style={{
                    left: field.coordinates.x * scale,
                    top: field.coordinates.y * scale,
                    width: field.coordinates.width * scale,
                    height: field.coordinates.height * scale,
                    fontSize: `${Math.max(9, 10 * scale)}px`,
                    border: '1px solid rgba(108,117,125,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    resize: 'none'
                  }}
                />
              );
            }
            
            return null;
          })}

          {/* Scores Table */}
          {(() => {
            const scoresField = allFields.find(f => f.type === 'scores_table');
            if (!scoresField) return null;
            
            const table = scoresField.data;
            
            return subjects.map((subject, index) => {
              const y = table.startY + (index * table.rowHeight);
              
              return (
                <React.Fragment key={`subject-${index}`}>
                  {/* Subject Name */}
                  <input
                    type="text"
                    value={subject.subject || ''}
                    onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                    placeholder="Subject"
                    className="position-absolute form-control form-control-sm"
                    style={{
                      left: table.subjectColumn.x * scale,
                      top: y * scale,
                      width: table.subjectColumn.width * scale,
                      height: table.rowHeight * scale,
                      fontSize: `${Math.max(9, 11 * scale)}px`,
                      border: '1px solid rgba(0,123,255,0.4)',
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }}
                  />

                  {/* Score Columns */}
                  {table.headers.map((header, headerIndex) => {
                    const headerName = header.name.toLowerCase();
                    let fieldName = '';
                    let isEditable = true;
                    let maxValue = 100;
                    
                    if (headerName.includes('ca1') || headerName.includes('ca 1')) {
                      fieldName = 'ca1';
                      maxValue = 20;
                    } else if (headerName.includes('ca2') || headerName.includes('ca 2')) {
                      fieldName = 'ca2';
                      maxValue = 20;
                    } else if (headerName.includes('exam')) {
                      fieldName = 'exam';
                      maxValue = 60;
                    } else {
                      isEditable = false; // Total, Grade, etc. are calculated
                    }

                    if (!isEditable) return null;

                    return (
                      <input
                        key={`${index}-${headerIndex}`}
                        type="number"
                        value={subject[fieldName] || 0}
                        onChange={(e) => {
                          const val = Math.min(maxValue, Math.max(0, Number(e.target.value)));
                          updateSubject(index, fieldName, val);
                        }}
                        min="0"
                        max={maxValue}
                        className="position-absolute form-control form-control-sm"
                        style={{
                          left: header.coordinates.x * scale,
                          top: y * scale,
                          width: header.coordinates.width * scale,
                          height: table.rowHeight * scale,
                          fontSize: `${Math.max(9, 11 * scale)}px`,
                          border: '1px solid rgba(40,167,69,0.5)',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          textAlign: 'center'
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              );
            });
          })()}
        </div>
      </div>

      <div className="alert alert-info mt-3 small mb-0">
        <strong>💡 Instructions:</strong> Fill in the scores directly on the template image. All fields are positioned exactly as they appear on your school's result sheet. Use zoom controls if needed.
      </div>
    </div>
  );
};

export default InteractiveTemplateEntry;