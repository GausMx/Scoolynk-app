import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, Upload, Loader, Check, X } from 'lucide-react';

const { REACT_APP_API_URL } = process.env;

const OCRStudentInput = ({ classId, method, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [extractedStudents, setExtractedStudents] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const token = localStorage.getItem('token');

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to access camera' });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Capture image from camera
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      stopCamera();
      processImage(imageData);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        setCapturedImage(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process image with OCR
  const processImage = async (imageData) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const res = await axios.post(
        `${REACT_APP_API_URL}/api/ocr/extract-base64`,
        { image: imageData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.data.students.length > 0) {
        setExtractedStudents(res.data.data.students);
        setMessage({ 
          type: 'success', 
          text: `Extracted ${res.data.data.students.length} student(s)` 
        });
      } else {
        setMessage({ 
          type: 'warning', 
          text: 'No students detected. Please try again or enter manually.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process image' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Update extracted student
  const updateStudent = (index, field, value) => {
    const updated = [...extractedStudents];
    updated[index][field] = value;
    setExtractedStudents(updated);
  };

  // Remove student
  const removeStudent = (index) => {
    setExtractedStudents(extractedStudents.filter((_, i) => i !== index));
  };

  // Add manual student
  const addManualStudent = () => {
    setExtractedStudents([
      ...extractedStudents,
      { name: '', regNo: '', parentPhone: '', parentName: '', amountPaid: 0 }
    ]);
  };

  // Submit students
  const handleSubmit = async () => {
    try {
      setLoading(true);

      await axios.post(
        `${REACT_APP_API_URL}/api/teacher/students/bulk`,
        { students: extractedStudents, classId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onComplete();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add students' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Render camera view
  const renderCamera = () => (
    <div className="text-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-100 rounded-3 mb-3"
        style={{ maxHeight: '400px' }}
        onLoadedMetadata={startCamera}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="d-flex gap-2 justify-content-center">
        <button
          className="btn btn-primary rounded-3"
          onClick={captureImage}
          disabled={loading}
        >
          <Camera size={18} className="me-2" />
          Capture
        </button>
        <button
          className="btn btn-secondary rounded-3"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Render captured/uploaded image
  const renderImage = () => (
    <div className="text-center mb-3">
      <img 
        src={capturedImage} 
        alt="Captured" 
        className="img-fluid rounded-3"
        style={{ maxHeight: '300px' }}
      />
      <button
        className="btn btn-sm btn-outline-secondary rounded-3 mt-2"
        onClick={() => {
          setCapturedImage(null);
          setExtractedStudents([]);
          if (method === 'ocr') startCamera();
        }}
      >
        Retake
      </button>
    </div>
  );

  // Render students form
  const renderStudentsForm = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6>Review Students ({extractedStudents.length})</h6>
        <button
          className="btn btn-sm btn-outline-primary rounded-3"
          onClick={addManualStudent}
        >
          + Add Row
        </button>
      </div>

      <div className="table-responsive mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="table table-sm">
          <thead className="table-light">
            <tr>
              <th>Name *</th>
              <th>Reg No *</th>
              <th>Parent Phone</th>
              <th>Amount Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {extractedStudents.map((student, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={student.name || ''}
                    onChange={(e) => updateStudent(index, 'name', e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={student.regNo || ''}
                    onChange={(e) => updateStudent(index, 'regNo', e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={student.parentPhone || ''}
                    onChange={(e) => updateStudent(index, 'parentPhone', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={student.amountPaid || 0}
                    onChange={(e) => updateStudent(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeStudent(index)}
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary rounded-3"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn btn-success rounded-3"
          onClick={handleSubmit}
          disabled={loading || extractedStudents.length === 0}
        >
          {loading ? (
            <>
              <Loader size={18} className="spinner-border spinner-border-sm me-2" />
              Saving...
            </>
          ) : (
            <>
              <Check size={18} className="me-2" />
              Add Students ({extractedStudents.length})
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type} rounded-3`}>
          {message.text}
        </div>
      )}

      {/* Method: OCR (Camera) */}
      {method === 'ocr' && !capturedImage && renderCamera()}

      {/* Method: Manual (File Upload) */}
      {method === 'manual' && !capturedImage && (
        <div className="text-center py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary btn-lg rounded-3 mb-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} className="me-2" />
            Upload Image
          </button>
          <p className="text-muted">Or enter students manually below</p>
          <button
            className="btn btn-outline-secondary rounded-3"
            onClick={addManualStudent}
          >
            + Add Student Manually
          </button>
        </div>
      )}

      {/* Show captured image */}
      {capturedImage && renderImage()}

      {/* Show loading */}
      {loading && !extractedStudents.length && (
        <div className="text-center py-4">
          <Loader size={48} className="text-primary spinner-border mb-3" />
          <p>Processing image...</p>
        </div>
      )}

      {/* Show extracted students form */}
      {extractedStudents.length > 0 && renderStudentsForm()}
    </div>
  );
};

export default OCRStudentInput;