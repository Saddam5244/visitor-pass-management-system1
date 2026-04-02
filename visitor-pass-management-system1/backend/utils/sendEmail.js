const { text } = require("body-parser");
require("dotenv").config(); 
const nodemailer = require("nodemailer");

const sendEmail = async(to, subject, text) =>{
    try{
         // Gmail transporter setup
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
      tls: {
        rejectUnauthorized: false, // local dev/test ke liye safe
      },
        });

        const mailOptions = {
            from : process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return info;
    }catch (error) {
        console.error("Email sending error:", error);
        throw error;
    }
};

module.exports = sendEmail;