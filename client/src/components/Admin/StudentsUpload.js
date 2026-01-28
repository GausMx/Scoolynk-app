// src/components/Admin/StudentsUpload.js - FIXED

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import Loading from "../common/Loading";

const { REACT_APP_API_URL } = process.env;

export default function StudentsUpload() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState(null);

  const token = localStorage.getItem("accessToken");

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setInitialLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/admin/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      alert("Failed to load classes");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedClass || !file) {
      alert("Please select a class and upload an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("classId", selectedClass);

    try {
      setLoading(true);
      const res = await axios.post(
        `${REACT_APP_API_URL}/api/admin/students/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResult(res.data);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Loading percentage={50} />;
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: "80px" }}>
      <div className="card shadow-sm rounded-4 p-3 p-md-4" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div className="mb-4">
          <h2 className="fw-bold text-primary d-flex align-items-center">
            <Upload size={32} className="me-2" />
            Bulk Student Upload
          </h2>
          <p className="text-muted small">Upload multiple students at once using an Excel file</p>
        </div>

        {/* Instructions Alert */}
        <div className="alert alert-info rounded-3 mb-4">
          <h6 className="fw-semibold mb-2">
            <FileSpreadsheet size={18} className="me-2" />
            Excel File Format
          </h6>
          <p className="small mb-2">Your Excel file should have these columns:</p>
          <ul className="small mb-0">
            <li><strong>name</strong> (required) - Student's full name</li>
            <li><strong>regNo</strong> (optional) - Registration number</li>
            <li><strong>parentName</strong> (optional) - Parent/Guardian name</li>
            <li><strong>parentPhone</strong> (optional) - Parent phone number</li>
            <li><strong>parentEmail</strong> (optional) - Parent email address</li>
          </ul>
        </div>

        {/* Class Selector */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Select Class *</label>
          <select
            className="form-select rounded-3"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
          {classes.length === 0 && (
            <small className="text-danger">No classes available. Please create classes first.</small>
          )}
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Upload Excel File (.xlsx, .xls) *</label>
          <input
            type="file"
            className="form-control rounded-3"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <small className="text-success mt-1 d-block">
              <CheckCircle size={14} className="me-1" />
              Selected: {file.name}
            </small>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || !selectedClass || !file}
          className="btn btn-primary rounded-3 px-4 w-100 w-md-auto"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} className="me-2" />
              Upload Students
            </>
          )}
        </button>

        {/* Upload Result */}
        {result && (
          <div className="mt-4">
            <div className="alert alert-success rounded-3">
              <h5 className="fw-semibold mb-2">
                <CheckCircle size={20} className="me-2" />
                Upload Summary
              </h5>
              <p className="mb-1"><strong>Successfully Inserted:</strong> {result.insertedCount}</p>
              <p className="mb-0"><strong>Skipped:</strong> {result.skipped?.length || 0}</p>
            </div>

            {result.skipped?.length > 0 && (
              <div className="card border-warning rounded-3">
                <div className="card-body">
                  <h6 className="fw-semibold mb-3 text-warning">
                    <AlertCircle size={18} className="me-2" />
                    Skipped Students ({result.skipped.length})
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Reg No</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.skipped.map((s, i) => (
                          <tr key={i}>
                            <td>{s.name}</td>
                            <td>{s.regNo}</td>
                            <td className="text-danger">{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}