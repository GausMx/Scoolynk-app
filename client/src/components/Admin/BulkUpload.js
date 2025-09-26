// src/components/Admin/BulkUpload.js

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import API from '../utils/api'; // ✅ corrected path
const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Only clear message if it was from a previous upload, not on every file change
    if (message.type === 'alert-success' || message.type === 'alert-danger') {
      setMessage({ text: '', type: '' });
    }

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headers = json[0];
          const rows = json.slice(1);


          // Support both parent and teacher uploads
          const isTeacherUpload = headers.includes('courses') || headers.includes('classes');
          const requiredParentHeaders = ['name', 'email', 'phone', 'childrenNamesAndClasses'];
          const requiredTeacherHeaders = ['name', 'email', 'phone', 'courses', 'classes'];
          const missing = isTeacherUpload
            ? requiredTeacherHeaders.filter(h => !headers.includes(h))
            : requiredParentHeaders.filter(h => !headers.includes(h));
          if (missing.length > 0) {
            setMessage({
              text: `Missing required columns: ${missing.join(', ')}`,
              type: 'alert-danger',
            });
            return;
          }

          const extractedData = rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
              if (header === 'childrenNamesAndClasses') {
                // Parse format: "Child Name - Class Name, Child2 Name - Class2 Name"
                rowData.children = (row[index] || '').split(',').map(c => {
                  const [name, className] = c.split('-').map(s => s.trim());
                  if (name && className) return { name, className };
                  return null;
                }).filter(Boolean);
              } else if (header === 'courses') {
                rowData.courses = (row[index] || '').split(',').map(c => c.trim()).filter(Boolean);
              } else if (header === 'classes') {
                rowData.classes = (row[index] || '').split(',').map(c => c.trim()).filter(Boolean);
              } else {
                rowData[header] = row[index];
              }
            });
            rowData.role = isTeacherUpload ? 'teacher' : 'parent';
            return rowData;
          });

          setParsedData(extractedData);

        } catch (error) {
          setMessage({
            text: 'Error parsing file. Please ensure it is a valid Excel/CSV.',
            type: 'alert-danger',
          });
          console.error(error);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUpload = async () => {
    setMessage({ text: '', type: '' });

    if (parsedData.length === 0) {
      setMessage({ text: 'No data to upload. Please select a file.', type: 'alert-danger' });
      return;
    }

    setLoading(true);
    try {
      // Remove childrenNames/courses/classes from payload, use arrays
      const uploadData = parsedData.map(row => {
        const { childrenNamesAndClasses, courses, classes, ...rest } = row;
        return {
          ...rest,
          ...(row.children ? { children: row.children } : {}),
          ...(row.courses ? { courses: row.courses } : {}),
          ...(row.classes ? { classes: row.classes } : {}),
        };
      });
      await API.post('/api/admin/bulk-register', { users: uploadData });
      setMessage({
        text: 'Parents and teachers registered successfully!',
        type: 'alert-success',
      });

      // ✅ Reset form after successful upload
      setFile(null);
      setParsedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      let backendMsg = error.response?.data?.message;
      let details = error.response?.data?.errors;
      let text = backendMsg || 'Upload failed. Please try again.';
      if (details && Array.isArray(details)) {
        text += ' Details: ' + details.map(e => e.msg || e.message).join('; ');
      }
      setMessage({
        text,
        type: 'alert-danger',
      });
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="card shadow-sm rounded-3 p-4 mb-4">
      <h4 className="card-title text-primary mb-3">Bulk User Upload</h4>

      {message.text && (
        <div className={`alert ${message.type} rounded-3`} role="alert">
          {message.text}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="file-upload" className="form-label">
          Upload Excel/CSV File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload"
          className="form-control rounded-3"
          onChange={handleFileChange}
          accept=".csv, .xlsx"
        />
      </div>

      {parsedData.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">Preview ({parsedData.length} rows)</h5>
          <div className="table-responsive" style={{ maxHeight: '300px' }}>
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  {Object.keys(parsedData[0]).map((key) => (
                    key !== 'children' ? <th key={key}>{key}</th> : null
                  ))}
                  <th>Children</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, index) => (
                  <tr key={index}>
                    {Object.entries(row).map(([key, value], i) => (
                      key !== 'children' ? <td key={i}>{String(value || '')}</td> : null
                    ))}
                    <td>
                      {Array.isArray(row.children)
                        ? row.children.map((child, idx) => <span key={idx} className="badge bg-secondary me-1">{child}</span>)
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleUpload}
            className="btn btn-primary rounded-3 shadow-sm mt-3"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
