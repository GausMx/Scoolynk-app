import { useState } from "react";
import axios from "axios";

export default function StudentsUpload({ classes }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!selectedClass || !file) {
      alert("Select a class and upload an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("classId", selectedClass);

    try {
      setLoading(true);
      const res = await axios.post(
        "/api/admin/students/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Bulk Student Upload</h2>

      {/* Class Selector */}
      <div className="mb-4">
        <label className="block mb-1 text-sm">Select Class</label>
        <select
          className="w-full border rounded p-2"
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
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block mb-1 text-sm">Upload Excel (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading…" : "Upload Students"}
      </button>

      {/* Upload Result */}
      {result && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Upload Summary</h3>
          <p>Inserted: {result.insertedCount}</p>
          <p>Skipped: {result.skipped?.length || 0}</p>

          {result.skipped?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Skipped Students</h4>
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Name</th>
                      <th className="border p-2">Reg No</th>
                      <th className="border p-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skipped.map((s, i) => (
                      <tr key={i}>
                        <td className="border p-2">{s.name}</td>
                        <td className="border p-2">{s.regNo}</td>
                        <td className="border p-2 text-red-600">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
