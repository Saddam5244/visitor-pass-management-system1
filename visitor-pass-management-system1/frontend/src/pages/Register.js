import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {ToastContainer} from 'react-toastify';
import { handleError, handleSuccess } from '../utils';
import { registerUser } from "../services/api";


function Register() {

    const [registerInfo, setRegisterInfo] = useState({
        name : '',
        email: '',
        password: '',
        role: "",
        phone : "",
        department: ""
    })
    const navigate= useNavigate();
    const handleChange= (e) =>{
        const {name, value} = e.target;
        const copyRegisterInfo = {...registerInfo};
        copyRegisterInfo[name] = value;
        setRegisterInfo(copyRegisterInfo);
    }

    const handleRegister = async (e) =>{
        e.preventDefault();
        const {name , email, password,role, phone, department} = registerInfo;
        if(!role || role === ""){
            return handleError('Please select a role')
        }
        if(!name || !email || !password || !role || !phone || !department){
            return handleError('All fields are required')
        }
        try{
            
            const response = await registerUser(registerInfo);
            
            const {message} = response.data;
            
                handleSuccess(message);
                setTimeout(()=>{
                navigate('/otpverify', {
                   state: {email}} )
                },1000)
            
        }catch(err){
           
            handleError(err.response?.data?.message || "Registration Failed");
        }
    }
  return (
    <div className='container'>
        <h1>Signup</h1>
        <form onSubmit={handleRegister}>
            <div>
                <label htmlFor='name'>Name</label>
                <input
                onChange={handleChange}
                   type='text'
                   name='name'
                   autoFocus
                   placeholder='Enter your name...'
                   value={registerInfo.name}
                   autoComplete='name'
                />
            </div>
            <div>
                <label htmlFor='email'>Email</label>
                <input
                onChange={handleChange}
                   type='email'
                   name='email'
                   placeholder='Enter your email...'
                   value={registerInfo.email}
                   autoComplete='email'
                />
            </div>

            <div>
                <label htmlFor='password'>Password</label>
                <input
                onChange={handleChange}
                   type='password'
                   name='password'
                   placeholder='Enter your password...'
                   value={registerInfo.password}
                   autoComplete='new-password'
                />
            </div>
                <div>
                <label htmlFor="phone">Phone</label>
                <input
                type="text"
                name="phone"
                placeholder="Enter phone number"
                onChange={handleChange}
                value={registerInfo.phone}
                />
            </div>
           <select 
           name="role"
            onChange={handleChange} 
            value={registerInfo.role}
            required
            >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
            <option value="security">Security</option>
            <option value="visitor">Visitor</option>
            </select>
       <hr></hr>
             <div>
                <label htmlFor='department'>Department</label>
                <input
                onChange={handleChange}
                   type='text'
                   name='department'
                   placeholder='Enter your department...'
                   value={registerInfo.department}
                />
            </div>
            <button type='submit'>Signup</button>
            <span>Already have an account?
                <Link to="/login">Login</Link>
            </span>
        </form>
        <ToastContainer/>
    </div>
  )
}

export default Register