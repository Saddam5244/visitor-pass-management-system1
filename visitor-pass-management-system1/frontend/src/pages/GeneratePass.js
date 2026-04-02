import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { useNavigate } from "react-router-dom";

function GeneratePass() {
   const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
 
  // Fetch visitor data
  const fetchVisitor = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("TOKEN:", token);
      const response = await axios.get(
        "http://localhost:4000/api/visitors/latest",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log("DATA:", response.data);
      setVisitor(response.data);

      

    } catch (error) {
      console.log("Error: ", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchVisitor();
  }, []);

  if (visitor === null) {
    return <h2>Loading Visitor Pass...</h2>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>

      <h1>Visitor Pass</h1>

      <div
        style={{
          border: "2px solid black",
          width: "300px",
          margin: "auto",
          padding: "20px"
        }}
      >
        <h3>Visitor Information</h3>
        <p><b>Name:</b> {visitor.name}</p>
        <p><b>Phone:</b> {visitor.phone}</p>
        <h3>QR Code</h3>

        <QRCode
          value={JSON.stringify(visitor)}
          size={250}
        />
      <button onClick={() => navigate("/qr-scanner")}>
            Scan QR
     </button>
      </div>

    </div>
  );
}

export default GeneratePass;