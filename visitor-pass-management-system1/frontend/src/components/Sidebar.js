import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {

  return (
    <div style={sidebarStyle}>

      <h2 style={{color:"white"}}>Dashboard</h2>

      <ul style={{listStyle:"none", padding:"0"}}>

        <li>
          <Link to="/admin-dashboard" style={linkStyle}>
            Admin Dashboard
          </Link>
        </li>

        <li>
          <Link to="/employee-dashboard" style={linkStyle}>
            Employee Dashboard
          </Link>
        </li>

        <li>
          <Link to="/security-dashboard" style={linkStyle}>
            Security Dashboard
          </Link>
        </li>

        <li>
          <Link to="/invite-visitor" style={linkStyle}>
            Visitor Registration
          </Link>
        </li>

        <li>
          <Link to="/generate-pass" style={linkStyle}>
            Generate Pass
          </Link>
        </li>

        <li>
          <Link to="/qr-scanner" style={linkStyle}>
            QR Scanner
          </Link>
        </li>

        <li>
          <Link to="/reports" style={linkStyle}>
            Reports
          </Link>
        </li>

      </ul>

    </div>
  );
}

const sidebarStyle = {
  width: "220px",
  height: "100vh",
  background: "#222",
  padding: "20px",
  position: "fixed",
  left: "0",
  top: "0"
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  display: "block",
  padding: "10px 0"
};

export default Sidebar;