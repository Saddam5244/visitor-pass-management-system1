import React from "react";

function VisitorCard({ visitor }) {

  if (!visitor) {
    return null;
  }

  return (
    <div style={cardStyle}>

      <h3>Visitor Information</h3>

      <p><strong>Name:</strong> {visitor.name}</p>

      <p><strong>Email:</strong> {visitor.email}</p>

      <p><strong>Phone:</strong> {visitor.phone}</p>

      <p><strong>Purpose:</strong> {visitor.purpose}</p>

      <p>
        <strong>Date:</strong>{" "}
        {visitor.createdAt
          ? new Date(visitor.createdAt).toLocaleDateString()
          : "N/A"}
      </p>

    </div>
  );
}

const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "10px",
  padding: "15px",
  width: "250px",
  margin: "10px",
  boxShadow: "0px 2px 5px rgba(0,0,0,0.2)"
};

export default VisitorCard;