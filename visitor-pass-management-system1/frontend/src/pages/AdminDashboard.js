import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    const fetchUsers = async () =>{
       try{
        const response = await axios.get("http://localhost:4000/api/user")
          setUsers(response.data);
       }catch(error){
          console.error("Error fetching users:", error);
       }       
    };
    useEffect(() =>{
        fetchUsers();
    },[]);

    const handleLogout = () =>{
        localStorage.removeItem("token");
        navigate("/login");
    };
    

  return (
    <div style={{padding: "20px"}}>
        <div style={{marginTop: "300px"}}>
    <button onClick={handleLogout}>
        Logout
    </button>
    </div>
    <hr/>
   <h1>Admin Dashboard</h1>
    <table border="5" cellPadding="20">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Department</th>
            </tr>
        </thead>
        <tbody>
            {users.map((user, index) =>(
                <tr key={index}>
                 <td>{user.name}</td>
                 <td>{user.email}</td>
                 <td>{user.role}</td>
                 <td>{user.phone}</td>
                  <td>{user.department}</td>
                </tr>
            ))}
        </tbody>
    </table>
    </div>
  )
}

export default AdminDashboard;