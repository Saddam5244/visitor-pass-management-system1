const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// transporter define 
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// OTP store init 
global.otpStore = global.otpStore || {};

const registerUser = async (req, res) => {
    try {
      console.log("EMAIL_USER:", process.env.EMAIL_USER);
        console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Present" : "Missing");

        const { name, email, password, phone, department, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        console.log("OTP:", otp);

        // Save data temporarily
        global.otpStore[email] = {
            otp,
            name,
            email,
            password,
            phone,
            department,
            role
        };

        // Send Email
        await transporter.sendMail({
          from: process.env.EMAIL_USER, 
            to: email,
            subject: "OTP Verification",
            text: `Your OTP is ${otp}`
        });

        res.status(200).json({
            success: true,
            message: "OTP sent to your email"
        });

    } catch (err) {
        console.log("Register Error Full:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const loginUser = async(req, res) =>{
    try{
        const { email, password } = req.body;
    
        const user = await User.findOne({ email });
        if (!user) 
            return res.status(404).json({ error: "User not found" });
    // // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
    
        if (!isMatch) 
            return res.status(400).json({ error: "Invalid credentials" });
    
        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
    
      res.json({
            message: "Login success",
            token: token,
            role: user.role
        })
    }catch(error){
        res.status(500).json({
       message: "Login failed"
      });
    }
}

const OTPVerify = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP required"
            });
        }

        const storedData = global.otpStore[email];

        if (!storedData || storedData.otp != otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Encrypt password
        const passwordHash = await bcrypt.hash(storedData.password, 10);

        
        const user = await User.create({
            name: storedData.name,
            email: storedData.email,
            passwordHash,
            role: storedData.role,
            phone: storedData.phone,
            department: storedData.department
        });

        // OTP (cleanup)
        delete global.otpStore[email];

        res.json({
            success: true,
            message: "User registered successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    OTPVerify
};
