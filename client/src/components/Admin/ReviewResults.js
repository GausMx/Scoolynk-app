import React, { useState, useMemo } from "react";

// ✅ Icon Components (Bootstrap icons)
const IconEdit = ({ className }) => <i className={`bi bi-pencil-square ${className}`}></i>;
const IconReview = ({ className }) => <i className={`bi bi-bar-chart-line-fill fs-4 ${className}`}></i>;
const IconCheck = ({ className }) => <i className={`bi bi-check-circle-fill ${className}`}></i>;
const IconX = ({ className }) => <i className={`bi bi-x-circle-fill ${className}`}></i>;

// ✅ Mock Data (Replace with API data later)
const MOCK_RESULTS = [
  { id: "res1", studentName: "Ngozi Okoro", class: "JSS 1", subject: "Mathematics", score: 75, status: "Pending" },
  { id: "res2", studentName: "Ngozi Okoro", class: "JSS 1", subject: "English", score: 82, status: "Approved" },
  { id: "res3", studentName: "Chinedu Eze", class: "SSS 3", subject: "Physics", score: 88, status: "Approved" },
  { id: "res4", studentName: "Fatima Bello", class: "JSS 2", subject: "English", score: 42, status: "Rejected" },
  { id: "res5", studentName: "Kunle Adebayo", class: "SSS 1", subject: "Chemistry", score: 95, status: "Pending" },
  { id: "res6", studentName: "Kunle Adebayo", class: "SSS 1", subject: "Biology", score: 90, status: "Pending" },
];

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

  return (
    <div className="container py-4">
      <div className="card shadow-lg rounded-4 border-0 p-3 p-sm-4">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h4 className="card-title text-dark fw-bold mb-0 d-flex align-items-center fs-5">
            <IconReview className="text-primary me-2" /> Review Pending Results
          </h4>
        </div>

        {message && (
          <div className="alert alert-info rounded-3 py-2 small">{message}</div>
        )}

        {/* ✅ Grouped results display */}
        {Object.keys(groupedResults).length === 0 ? (
          <p className="text-center text-muted">No results found requiring review.</p>
        ) : (
          Object.entries(groupedResults).map(([className, students]) => (
            <div key={className} className="mb-5">
              <h5 className="fw-bold text-primary border-bottom pb-2 mb-3">
                {className}
              </h5>

              {Object.entries(students).map(([studentName, studentResults]) => (
                <div key={studentName} className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">{studentName}</h6>

                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
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
                                {item.status === "Pending" ? (
                                  <>
                                    <button
                                      className="btn btn-sm btn-outline-success me-1 my-1 rounded-3"
                                      onClick={() =>
                                        handleUpdateStatus(item.id, studentName, "Approved")
                                      }
                                      disabled={loading}
                                    >
                                      <IconCheck />
                                      <span className="d-none d-md-inline ms-1">Approve</span>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger me-1 my-1 rounded-3"
                                      onClick={() =>
                                        handleUpdateStatus(item.id, studentName, "Rejected")
                                      }
                                      disabled={loading}
                                    >
                                      <IconX />
                                      <span className="d-none d-md-inline ms-1">Reject</span>
                                    </button>
                                  </>
                                ) : null}
                                <button
                                  className="btn btn-sm btn-outline-secondary my-1 rounded-3"
                                  onClick={() => handleEdit(item)}
                                  disabled={loading}
                                >
                                  <IconEdit />
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
      </div>
    </div>
  );
};

export default ReviewResults;
