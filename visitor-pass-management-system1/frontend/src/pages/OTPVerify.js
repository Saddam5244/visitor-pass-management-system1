import React, { useState } from 'react';
import axios from "axios";
import { useLocation, useNavigate} from "react-router-dom";
import {ToastContainer, toast} from "react-toastify";


 function OTPVerify() {
    const [otp, setOtp] = useState("");
   const navigate = useNavigate();
   const location = useLocation();
   const email = location.state?.email;
    const handleVerify = async (e) =>{
        e.preventDefault();

    if(!otp){
        toast.error("Please enter OTP");
        return;
    }
    try{
        const response = await axios.post("http://localhost:4000/api/user/otpverify",
            {email, otp}
        );
        const {success, message} = response.data;
        if(success){
            toast.success(message);
            setTimeout(() =>{
                navigate("/login");
            }, 1500);
        }else{
            toast.error(message);
        }
    }catch(error){
        toast.error(
            error.response?.data?.message || "OTP Verification failed"
        );
    }
    };
    
  return (
    <div className='container3'>
   <h2>OTPVerify</h2>
   <form onSubmit={handleVerify}>
       <div>
        <label style={{marginTop:"50px"}}>OTP </label>
        <input
        type='text'
        placeholder='Enter otp'
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        />
       </div>
       <button type='submit'>
        Verify OTP
       </button>
   </form>
   <ToastContainer/>
    </div>
  );
}

export default OTPVerify;