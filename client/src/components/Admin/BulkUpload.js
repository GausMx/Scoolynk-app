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
    setMessage({ text: '', type: '' });

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

          // ✅ Required headers check
          const requiredHeaders = ['name', 'email', 'phone', 'childrenNames'];
          const missing = requiredHeaders.filter(h => !headers.includes(h));
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
              rowData[header] = row[index];
            });
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
      await API.post('/admin/bulk-register', { users: parsedData });
      setMessage({
        text: 'Parents registered successfully!',
        type: 'alert-success',
      });

      // ✅ Reset form after successful upload
      setFile(null);
      setParsedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Upload failed. Please try again.',
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
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{String(value || '')}</td>
                    ))}
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
