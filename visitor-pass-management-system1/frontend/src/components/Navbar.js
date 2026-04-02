import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      background: "#333",
      padding: "10px",
      color: "white"
    }}>

      <h2>Visitor Management</h2>

      <div>

        <Link to="/admin-dashboard" style={linkStyle}>Admin</Link>

        <Link to="/employee-dashboard" style={linkStyle}>Employee</Link>

        <Link to="/security-dashboard" style={linkStyle}>Security</Link>

        <Link to="/invite-visitor" style={linkStyle}>Visitor Register</Link>

        <Link to="/reports" style={linkStyle}>Reports</Link>

        <Link to="/generate-pass" style={linkStyle}>Generate Pass</Link>

        <Link to="/qr-scanner" style={linkStyle}>Scan QR</Link>

        <button
          onClick={handleLogout}
          style={{
            marginLeft: "10px",
            padding: "5px 10px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

const linkStyle = {
  color: "white",
  marginRight: "15px",
  textDecoration: "none"
};

export default Navbar;