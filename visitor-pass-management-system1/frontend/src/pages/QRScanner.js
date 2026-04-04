import { Scanner } from "@yudiel/react-qr-scanner";
import { useState, useEffect } from "react";
import { verifyVisitor, createLog } from "../services/api";

function QRScanner() {
  const [scanResult, setScanResult] = useState("");
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        console.log("DECODED TOKEN:", decoded);
      } catch (error) {
        console.log("Token decode error");
      }
    } else {
      console.log("No token found");
    }

    console.log("ROLE:", localStorage.getItem("role"));
  }, []);
  const handleScan = async (data) => {

     const user = JSON.parse(localStorage.getItem("user"));
     const role = user?.role;

      if (role !== "security" && role !== "admin") {
        alert("Access denied: Only security can scan QR");
        return;
      }
    try {
      const parsedData = JSON.parse(data);
        //  Visitor verify
    await verifyVisitor(parsedData._id);
      //  Log create
    await createLog({
      visitor: parsedData._id,
      status: "checked-in",
      checkInTime: new Date(),
    });

      alert("Entry Allowed & Logged");

    } catch (err) {
  console.log("ERROR:", err.response?.data || err.message);
  alert("Error: " + (err.response?.data?.message || err.message));
}
  };

  let parsedData = null;

  try {
    if (scanResult) {
      parsedData = JSON.parse(scanResult);
    }
  } catch (e) {
    console.log("Invalid JSON");
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ marginTop: "40px"}}>QR Scanner</h1>

      <Scanner
        onScan={(result) => {
          if (result && !scanned) {
            setScanned(true);

            const text = result[0]?.rawValue;
            console.log("DATA:", text);

            setScanResult(text);
            handleScan(text);
          }
        }}
        onError={(err) => console.log("SCAN ERROR:", err)}
      />

     
      {parsedData && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>Visitor Details</h3>
          <p><b>Name:</b> {parsedData.name}</p>
          <p><b>Email:</b> {parsedData.email}</p>
          <p><b>Phone:</b> {parsedData.phone}</p>
        </div>
      )}
    </div>
  );
}

export default QRScanner;