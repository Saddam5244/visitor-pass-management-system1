import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createVisitor } from "../services/api";

function VisitorRegistration() {
const navigate = useNavigate();
  const [visitor, setVisitor] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: ""
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVisitor({
      ...visitor,
      [name]: value
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, purpose } = visitor;

    if (!name || !email || !phone || !purpose) {
      toast.error("All fields are required");
      return;
    }

    try {
      await createVisitor(visitor);
      toast.success("Visitor registered successfully");

        setTimeout(() => {
          navigate("/generate-pass");  
        }, 1500);

      setVisitor({
        name: "",
        email: "",
        phone: "",
        purpose: ""
      });

    } catch (error) {

      toast.error(
        error.response?.data?.message || "Registration failed"
      );

    }
  };

  return (
    <div className="container4">

      <h1> Invite Visitor </h1>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={visitor.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={visitor.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            type="text"
            name="phone"
            placeholder="Enter phone number"
            value={visitor.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Purpose</label>
          <input
            type="text"
            name="purpose"
            placeholder="Purpose of visit"
            value={visitor.purpose}
            onChange={handleChange}
          />
        </div>

        <button type="submit">
          Register
        </button>

      </form>

      <ToastContainer />

    </div>
  );
}
export default VisitorRegistration;