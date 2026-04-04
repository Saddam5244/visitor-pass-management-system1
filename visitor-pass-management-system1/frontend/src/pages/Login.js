import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';
import { loginUser } from "../services/api";


function Login() {

    const [loginInfo, setLoginInfo] = useState({
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginInfo({ ...loginInfo, [name]: value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const { email, password } = loginInfo;
           
        if (!email || !password) {
            return handleError('Email and password are required');
        }

        try {
            
            const res = await loginUser(loginInfo);

            // Backend response
            const { message, token, role } = res.data;

            if (res.ok) {
                handleSuccess(message);

                //  Store token
                localStorage.setItem("token", token);
                localStorage.setItem("role", role);
                localStorage.setItem("user", JSON.stringify({ role }));

                //  Role based redirect
                setTimeout(() => {
                    if (role === "admin") navigate("/admin-dashboard");
                    else if (role === "employee") navigate("/employee-dashboard");
                    else if (role === "security") navigate("/security-dashboard");
                    else navigate("/invite-visitor");
                }, 1000);

            } else {
                handleError(message || "Login failed");
            }

        } catch (err) {
            console.log(err);
            handleError("Server error");
        }
    };

    return (
        <div className='container1'>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>

                <div>
                    <label>Email</label>
                    <input
                        type='email'
                        name='email'
                        value={loginInfo.email}
                        onChange={handleChange}
                        placeholder='Enter your email...'
                        autoComplete='email'
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type='password'
                        name='password'
                        value={loginInfo.password}
                        onChange={handleChange}
                        placeholder='Enter your password...'
                        autoComplete='current-password'
                    />
                </div>

                <button type='submit'>Login</button>

                <span>
                    Don't have an account?
                    <Link to="/register"> Signup</Link>
                </span>
            </form>

            <ToastContainer />
        </div>
    )
}

export default Login;