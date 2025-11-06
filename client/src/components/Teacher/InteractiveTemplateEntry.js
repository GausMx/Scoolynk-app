// src/components/Teacher/InteractiveTemplateEntry.js
// This component overlays scores onto the template image

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, Send } from 'lucide-react';

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
  const canvasRef = useRef(null);
  const [canvasImage, setCanvasImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate filled template when data changes
  useEffect(() => {
    if (template?.templateImage) {
      generateFilledTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, affectiveTraits, fees, attendance, comments]);

  const addSubject = () => {
    setSubjects([...subjects, { subject: '', ca1: 0, ca2: 0, exam: 0 }]);
  };

  const removeSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const generateFilledTemplate = async () => {
    if (!template?.templateImage || !canvasRef.current) return;

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Load the template image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw template image
        ctx.drawImage(img, 0, 0);

        // Set text properties
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';

        // Calculate positions (adjust these based on your template)
        const startX = 50;
        const startY = 200;
        const lineHeight = 35;

        // Draw student info
        ctx.font = 'bold 24px Arial';
        ctx.fillText(student.name || '', 150, 120);
        ctx.fillText(student.regNo || '', 500, 120);
        ctx.fillText(student.classId?.name || '', 150, 150);

        // Draw subject headers
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Subject', startX, startY);
        ctx.fillText('CA1', startX + 200, startY);
        ctx.fillText('CA2', startX + 270, startY);
        ctx.fillText('Exam', startX + 340, startY);
        ctx.fillText('Total', startX + 420, startY);
        ctx.fillText('Grade', startX + 500, startY);

        // Draw subjects and scores
        ctx.font = '16px Arial';
        subjects.forEach((subject, index) => {
          const y = startY + 30 + (index * lineHeight);
          const total = (Number(subject.ca1) || 0) + (Number(subject.ca2) || 0) + (Number(subject.exam) || 0);
          const percent = (total / 100) * 100;
          let grade = 'F';
          if (percent >= 70) grade = 'A';
          else if (percent >= 60) grade = 'B';
          else if (percent >= 50) grade = 'C';
          else if (percent >= 40) grade = 'D';

          ctx.fillText(subject.subject || '', startX, y);
          ctx.fillText(subject.ca1?.toString() || '0', startX + 200, y);
          ctx.fillText(subject.ca2?.toString() || '0', startX + 270, y);
          ctx.fillText(subject.exam?.toString() || '0', startX + 340, y);
          ctx.fillText(total.toString(), startX + 420, y);
          ctx.fillText(grade, startX + 500, y);
        });

        // Draw affective traits
        const traitsY = startY + (subjects.length * lineHeight) + 80;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Affective Traits:', startX, traitsY);
        
        ctx.font = '14px Arial';
        let traitY = traitsY + 25;
        Object.entries(affectiveTraits).forEach(([trait, value]) => {
          ctx.fillText(`${trait}: ${value}/5`, startX, traitY);
          traitY += 25;
        });

        // Draw fees
        ctx.font = 'bold 16px Arial';
        const feesX = startX + 350;
        ctx.fillText('School Fees:', feesX, traitsY);
        
        ctx.font = '14px Arial';
        let feeY = traitsY + 25;
        Object.entries(fees).forEach(([feeType, amount]) => {
          ctx.fillText(`${feeType}: ₦${Number(amount).toLocaleString()}`, feesX, feeY);
          feeY += 25;
        });

        // Draw attendance
        const attendanceY = Math.max(traitY, feeY) + 40;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Attendance:', startX, attendanceY);
        ctx.font = '14px Arial';
        ctx.fillText(`Opened: ${attendance.opened} | Present: ${attendance.present} | Absent: ${attendance.absent}`, startX, attendanceY + 25);

        // Draw comments
        const commentY = attendanceY + 80;
        ctx.font = 'bold 16px Arial';
        ctx.fillText("Teacher's Comment:", startX, commentY);
        ctx.font = '14px Arial';
        
        // Wrap comment text
        const maxWidth = canvas.width - (startX * 2);
        const words = (comments.teacher || '').split(' ');
        let line = '';
        let lineY = commentY + 25;
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth) {
            ctx.fillText(line, startX, lineY);
            line = word + ' ';
            lineY += 20;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, startX, lineY);

        // Convert canvas to image
        const filledImage = canvas.toDataURL('image/png');
        setCanvasImage(filledImage);
        setIsGenerating(false);
      };

      img.onerror = () => {
        console.error('Failed to load template image');
        setIsGenerating(false);
      };

      img.src = template.templateImage;
    } catch (error) {
      console.error('Error generating filled template:', error);
      setIsGenerating(false);
    }
  };

  const handleSaveWithImage = async () => {
    await generateFilledTemplate();
    if (onSave) {
      onSave(canvasImage);
    }
  };

  const handleSubmitWithImage = async () => {
    await generateFilledTemplate();
    if (onSubmit) {
      onSubmit(canvasImage);
    }
  };

  return (
    <div className="row">
      {/* Left: Entry Form */}
      <div className="col-md-6" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="card bg-light mb-3">
          <div className="card-body py-2">
            <div className="row">
              <div className="col-6">
                <small className="text-muted">Student</small>
                <div className="fw-bold">{student?.name}</div>
              </div>
              <div className="col-6">
                <small className="text-muted">Reg No</small>
                <div className="fw-bold">{student?.regNo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Subject Scores</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={addSubject}>
              <Plus size={14} className="me-1" />
              Add
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Subject</th>
                  <th width="60">CA1</th>
                  <th width="60">CA2</th>
                  <th width="60">Exam</th>
                  <th width="60">Total</th>
                  <th width="40"></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => {
                  const total = (Number(subject.ca1) || 0) + (Number(subject.ca2) || 0) + (Number(subject.exam) || 0);
                  return (
                    <tr key={index}>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          value={subject.subject}
                          onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={subject.ca1}
                          onChange={(e) => updateSubject(index, 'ca1', Math.min(20, Math.max(0, Number(e.target.value))))}
                          min="0" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={subject.ca2}
                          onChange={(e) => updateSubject(index, 'ca2', Math.min(20, Math.max(0, Number(e.target.value))))}
                          min="0" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={subject.exam}
                          onChange={(e) => updateSubject(index, 'exam', Math.min(60, Math.max(0, Number(e.target.value))))}
                          min="0" max="60"
                        />
                      </td>
                      <td className="text-center fw-bold">{total}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeSubject(index)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affective Traits - Compact */}
        <div className="mb-3">
          <h6 className="mb-2">Affective Traits (1-5)</h6>
          <div className="row g-2">
            {Object.keys(affectiveTraits).map(trait => (
              <div key={trait} className="col-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text text-capitalize" style={{ fontSize: '11px' }}>{trait}</span>
                  <input 
                    type="number"
                    className="form-control"
                    value={affectiveTraits[trait]}
                    onChange={(e) => setAffectiveTraits({
                      ...affectiveTraits,
                      [trait]: Math.min(5, Math.max(1, Number(e.target.value)))
                    })}
                    min="1" max="5"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fees - Compact */}
        <div className="mb-3">
          <h6 className="mb-2">Fees (₦)</h6>
          <div className="row g-2">
            {Object.keys(fees).map(feeType => (
              <div key={feeType} className="col-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text text-capitalize" style={{ fontSize: '11px' }}>{feeType}</span>
                  <input 
                    type="number"
                    className="form-control"
                    value={fees[feeType]}
                    onChange={(e) => setFees({
                      ...fees,
                      [feeType]: Math.max(0, Number(e.target.value))
                    })}
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div className="mb-3">
          <h6 className="mb-2">Attendance</h6>
          <div className="row g-2">
            <div className="col-4">
              <input 
                type="number"
                className="form-control form-control-sm"
                placeholder="Opened"
                value={attendance.opened}
                onChange={(e) => setAttendance({
                  ...attendance,
                  opened: Math.max(0, Number(e.target.value))
                })}
                min="0"
              />
            </div>
            <div className="col-4">
              <input 
                type="number"
                className="form-control form-control-sm"
                placeholder="Present"
                value={attendance.present}
                onChange={(e) => setAttendance({
                  ...attendance,
                  present: Math.max(0, Number(e.target.value))
                })}
                min="0"
              />
            </div>
            <div className="col-4">
              <input 
                type="number"
                className="form-control form-control-sm"
                placeholder="Absent"
                value={attendance.absent}
                onChange={(e) => setAttendance({
                  ...attendance,
                  absent: Math.max(0, Number(e.target.value))
                })}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-3">
          <h6 className="mb-2">Teacher's Comment</h6>
          <textarea 
            className="form-control form-control-sm"
            rows="3"
            value={comments.teacher}
            onChange={(e) => setComments({
              ...comments,
              teacher: e.target.value
            })}
            placeholder="Enter your comment..."
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={handleSaveWithImage}>
            <Save size={16} className="me-1" />
            Save Draft
          </button>
          <button className="btn btn-success" onClick={handleSubmitWithImage}>
            <Send size={16} className="me-1" />
            Submit to Admin
          </button>
        </div>
      </div>

      {/* Right: Live Preview of Filled Template */}
      <div className="col-md-6">
        <div className="sticky-top" style={{ top: '20px' }}>
          <h6 className="mb-2">
            Live Preview
            {isGenerating && <span className="spinner-border spinner-border-sm ms-2"></span>}
          </h6>
          
          {/* Canvas for generating filled template */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Display filled template */}
          <div className="border rounded p-2 bg-light" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {canvasImage ? (
              <img src={canvasImage} alt="Filled result" className="img-fluid w-100" />
            ) : (
              <div className="text-center text-muted py-5">
                Fill in the form to see the result preview
              </div>
            )}
          </div>
          
          <div className="alert alert-info mt-2 small">
            <strong>Live Preview:</strong> Scores are automatically overlaid on the template. This is what admin will see.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTemplateEntry;