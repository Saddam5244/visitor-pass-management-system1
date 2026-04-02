import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

function SecurityDashboard() {
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

    const fetchLogs = async () =>{
       try{
        const res = await axios.get("http://localhost:4000/api/checklogs",
            {
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
        
        setLogs(res.data);
       }catch(error){
          console.error("Error fetching visitors:", error);
       }       
    };
    useEffect(() =>{
       
        fetchLogs();
    },[]);

  //  Check-out visitor 
  const handleCheckOut = async(id) =>{
    try{
        await axios.put(`http://localhost:4000/api/checklogs/${id}`,
            {},
            {
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
       navigate("/reports")
     fetchLogs();
    }catch(error) {
        console.log("Check-out error", error);
    }
  }
//   logout
    const handleLogout = () =>{
        localStorage.removeItem("token");
        navigate("/login");
    };
    

  return (
    <div style={{padding: "40px"}}>
    <div style={{marginTop: "200px"}}>
    <button onClick={handleLogout}>
        Logout
    </button>
    </div>
    <hr/>
    <h2>Security Dashboard</h2>
    <table border="5" cellPadding="20">

          <thead>
            <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
            </tr>
            </thead>
                    <tbody>
            {logs.map((log) => {
                return (
                <tr key={log._id}>
                    <td>{log.visitor?.name}</td>  
                    <td>{log.status}</td>         
                    <td>{new Date(log.checkInTime).toLocaleString()}</td> 
                    <td>
                    {log.checkOutTime
                        ? new Date(log.checkOutTime).toLocaleString()
                        : "Not Checked Out"}
                        </td>
                    <td>
                    <button onClick={() => handleCheckOut(log._id)}>
                        Check Out
                    </button>  
                    </td>
                </tr>
                );
            })}
            </tbody>
    </table>
    </div>
  )
}

export default SecurityDashboard;