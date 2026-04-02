const axios = require("axios");
const { route } = require("../routes/visitors");

const sendSMS = async(phone, message) =>{
    try {
        const response = await axios.post.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
            route: "q",
            message: message,
            language: "english",
            flash: 0,
            numbers: phone
        },{
            headers:{
                authorization: process.env.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
        }
    );
        console.log("SMS sent:", response.data);
        
    }catch(error){
        console.log("SMS sending error:", error.response?.data || error.message);
    }
};

module.exports = sendSMS;
