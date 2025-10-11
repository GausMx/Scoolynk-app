import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Edit3,
  BarChart3,
  Send,
  BookOpen,
  Users,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// ✅ Mock Data (Replace with API data later)
const MOCK_RESULTS = [
  { id: "res1", studentName: "Ngozi Okoro", class: "JSS 1", subject: "Mathematics", score: 75, status: "Pending" },
  { id: "res2", studentName: "Ngozi Okoro", class: "JSS 1", subject: "English", score: 82, status: "Approved" },
  { id: "res3", studentName: "Chinedu Eze", class: "SSS 3", subject: "Physics", score: 88, status: "Approved" },
  { id: "res4", studentName: "Fatima Bello", class: "JSS 2", subject: "English", score: 42, status: "Rejected" },
  { id: "res5", studentName: "Kunle Adebayo", class: "SSS 1", subject: "Chemistry", score: 95, status: "Pending" },
  { id: "res6", studentName: "Kunle Adebayo", class: "SSS 1", subject: "Biology", score: 90, status: "Pending" },
];

const COLORS = ["#0d6efd", "#28a745", "#dc3545", "#ffc107"];

const ReviewResults = () => {
  const [results, setResults] = useState(MOCK_RESULTS);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Group results → { className: { studentName: [results...] } }
  const groupedResults = useMemo(() => {
    const grouped = {};
    results.forEach((res) => {
      if (!grouped[res.class]) grouped[res.class] = {};
      if (!grouped[res.class][res.studentName]) grouped[res.class][res.studentName] = [];
      grouped[res.class][res.studentName].push(res);
    });
    return grouped;
  }, [results]);

  // ✅ Stats summary for widgets + chart
  const total = results.length;
  const approved = results.filter((r) => r.status === "Approved").length;
  const pending = results.filter((r) => r.status === "Pending").length;
  const rejected = results.filter((r) => r.status === "Rejected").length;

  const chartData = [
    { name: "Approved", value: approved },
    { name: "Pending", value: pending },
    { name: "Rejected", value: rejected },
  ];

  // ✅ Handle status updates (API simulation)
  const handleUpdateStatus = (resultId, studentName, newStatus) => {
    setLoading(true);
    setMessage("");
    setTimeout(() => {
      setResults((prev) =>
        prev.map((res) => (res.id === resultId ? { ...res, status: newStatus } : res))
      );
      setMessage(`Result for ${studentName} ${newStatus.toLowerCase()} successfully.`);
      setLoading(false);
    }, 600);
  };

  const handleEdit = (result) => {
    setMessage(`Editing result for ${result.studentName} (${result.subject}).`);
  };

  const handleSendAll = () => {
    setLoading(true);
    setTimeout(() => {
      setMessage("All reviewed results have been sent to parents successfully.");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark d-flex align-items-center">
          <BarChart3 className="text-primary me-2" /> Review Student Results
        </h4>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="alert alert-info rounded-3 py-2 small">{message}</div>
      )}

      {/* Stats Widgets */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 text-center bg-primary text-white">
            <h6>Total Results</h6>
            <h3 className="fw-bold mb-0">{total}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 text-center bg-success text-white">
            <h6>Approved</h6>
            <h3 className="fw-bold mb-0">{approved}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 text-center bg-warning text-dark">
            <h6>Pending</h6>
            <h3 className="fw-bold mb-0">{pending}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 text-center bg-danger text-white">
            <h6>Rejected</h6>
            <h3 className="fw-bold mb-0">{rejected}</h3>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body d-flex justify-content-center">
          <div style={{ width: "300px", height: "220px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Results by Class and Student */}
      {Object.keys(groupedResults).length === 0 ? (
        <p className="text-center text-muted">No results found for review.</p>
      ) : (
        Object.entries(groupedResults).map(([className, students]) => (
          <div key={className} className="mb-5">
            <h5 className="fw-bold text-primary border-bottom pb-2 mb-3">
              <BookOpen className="me-2" /> {className}
            </h5>

            {Object.entries(students).map(([studentName, studentResults]) => (
              <div key={studentName} className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <Users className="text-secondary me-2" />
                  <h6 className="fw-semibold text-dark mb-0">{studentName}</h6>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle shadow-sm rounded-3 overflow-hidden">
                    <thead className="table-light">
                      <tr>
                        <th>Subject</th>
                        <th className="text-center">Score</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map((item) => (
                        <tr key={item.id}>
                          <td>{item.subject}</td>
                          <td className="text-center">{item.score}</td>
                          <td className="text-center">
                            {item.status === "Pending" && (
                              <span className="badge bg-warning text-dark rounded-pill">
                                Pending
                              </span>
                            )}
                            {item.status === "Approved" && (
                              <span className="badge bg-success rounded-pill">
                                Approved
                              </span>
                            )}
                            {item.status === "Rejected" && (
                              <span className="badge bg-danger rounded-pill">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center flex-wrap">
                              {item.status === "Pending" && (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-success me-1 my-1 rounded-3"
                                    onClick={() =>
                                      handleUpdateStatus(item.id, studentName, "Approved")
                                    }
                                    disabled={loading}
                                  >
                                    <CheckCircle size={16} />
                                    <span className="d-none d-md-inline ms-1">Approve</span>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger me-1 my-1 rounded-3"
                                    onClick={() =>
                                      handleUpdateStatus(item.id, studentName, "Rejected")
                                    }
                                    disabled={loading}
                                  >
                                    <XCircle size={16} />
                                    <span className="d-none d-md-inline ms-1">Reject</span>
                                  </button>
                                </>
                              )}
                              <button
                                className="btn btn-sm btn-outline-secondary my-1 rounded-3"
                                onClick={() => handleEdit(item)}
                                disabled={loading}
                              >
                                <Edit3 size={16} />
                                <span className="d-none d-md-inline ms-1">
                                  {item.status === "Pending" ? "Edit" : "View"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Send All to Parents Button */}
      <div className="text-center mt-4">
        <button
          className="btn btn-lg btn-primary px-5 rounded-4 shadow"
          onClick={handleSendAll}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="me-2 spin" /> Sending...
            </>
          ) : (
            <>
              <Send className="me-2" /> Send All to Parents
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewResults;
