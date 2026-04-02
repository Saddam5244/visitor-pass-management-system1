import React, { useEffect, useState, } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Reports() {

  const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

  // Fetch Logs from backend
  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/checklogs");
      setLogs(res.data);
    } catch (error) {
      console.log("Error fetching logs", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  //   logout
    const handleLogout = () =>{
        localStorage.removeItem("token");
        navigate("/login");
    };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{marginTop: "50px"}}>
    <button onClick={handleLogout}>
        Logout
    </button>
    </div>
      <h1>Visitor Reports</h1>

      <table border="5" cellPadding="20" width="100%">

        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Check-In Time</th>
            <th>Check-Out Time</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{log.visitor?.name}</td>
              <td>{log.status}</td>
              <td>
                {new Date(log.checkInTime).toLocaleString()}
              </td>
              <td>
                {log.checkOutTime
                  ? new Date(log.checkOutTime).toLocaleString()
                  : "Not Checked Out"}
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default Reports;