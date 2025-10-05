import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ user, role }) => {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const adminLinks = [
    { path: "/admin", label: "Home" },
    { path: "/admin/review-results", label: "Review Results" },
    { path: "/admin/broadcast", label: "Broadcast Notification" },
    { path: "/admin/settings", label: "Settings" },
  ];

  const parentLinks = [
    { path: "/parent", label: "Dashboard" },
    { path: "/parent/notifications", label: "Notifications" },
    { path: "/parent/results", label: "Results" },
    { path: "/parent/payments", label: "Payments" },
  ];

  const teacherLinks = [
    { path: "/teacher", label: "Dashboard" },
    { path: "/teacher/grade-input", label: "Grade Input" },
  ];

  const links =
    role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : parentLinks;

  const displayName =
    user && (role === "admin" ? user.schoolName : user.name);

  // Toggle collapse manually
  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <>
      {/* ================= Desktop Sidebar ================= */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{ width: "250px", height: "100vh", position: "sticky", top: 0 }}
      >
        <h5 className="mb-3">{displayName || "Loading..."}</h5>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          {links.map((link) => (
            <li className="nav-item" key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${
                  location.pathname === link.path
                    ? "active text-white"
                    : "text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <small>{displayName || ""}</small>
        </div>
      </div>

      {/* ================= Mobile Navbar ================= */}
      <nav className="navbar navbar-expand-sm bg-dark navbar-dark d-md-none fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">{displayName || "Scoolynk"}</span>
          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleNav}
            aria-controls="mobileNav"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`}
            id="mobileNav"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {links.map((link) => (
                <li className="nav-item" key={link.path}>
                  <Link
                    to={link.path}
                    className={`nav-link ${
                      location.pathname === link.path ? "active" : ""
                    }`}
                    onClick={closeNav} // closes navbar after navigation
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Add margin so page content doesn’t hide under navbar */}
      <div className="d-md-none" style={{ marginTop: "70px" }}></div>
    </>
  );
};

export default Sidebar;
