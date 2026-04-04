// import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { getVisitors } from "../services/api";

function EmployeeDashboard() {
    const [visitors, setVisitors] = useState([]);
    const navigate = useNavigate();

    const fetchVisitors = async () =>{
       try{
        const res = await getVisitors()
          setVisitors(res.data);
       }catch(error){
          console.error("Error fetching visitors:", error.response?.data || error.message);
       }       
    };
    useEffect(() =>{
        fetchVisitors();
    },[]);

    const handleLogout = () =>{
        localStorage.removeItem("token");
        navigate("/login");
    };
    

  return (
    <div style={{padding: "20px",}}>
        <div style={{marginTop: "100px"}}>
    <button style={{marginTop : "200px"}} onClick={handleLogout}>
        Logout
    </button>
    </div>
    <hr/>
    <h2>Employee Dashboard</h2>
    <table border="5" cellPadding="20">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
               
            </tr>
        </thead>
        <tbody>
            {visitors.map((visitor, index) =>{
                return(
                <tr key={index}>
                 <td>{visitor.name}</td>
                 <td>{visitor.email}</td>
                 <td>{visitor.phone}</td>
                 
                </tr>
                )
            })}
        </tbody>
    </table>
    </div>
  )
}

export default EmployeeDashboard;