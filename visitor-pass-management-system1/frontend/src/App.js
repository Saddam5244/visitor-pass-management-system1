import React from 'react';
import {BrowserRouter, Navigate, Routes, Route} from "react-router-dom";
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from "./pages/AdminDashboard";
import OTPVerify from './pages/OTPVerify';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import VisitorRegistration from './pages/VisitorRegistration';
import GeneratePass from './pages/GeneratePass';
import QRScanner from "./pages/QRScanner";
import Reports from './pages/Reports';
function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to ="/register" />}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/otpverify' element={<OTPVerify/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/invite-visitor' element={<VisitorRegistration/>}/>
        <Route path='/generate-pass' element={<GeneratePass/>}/>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path='/employee-dashboard' element={<EmployeeDashboard/>}/>
        <Route path='/security-dashboard' element={<SecurityDashboard/>}/>
        <Route path="/qr-scanner" element={<QRScanner />}/>
        <Route path="/reports" element={<Reports />}/>
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
