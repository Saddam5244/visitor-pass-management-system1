const sendSMS = require("../utils/sendSMS");

const sendVisitorSMS = async(req, res) =>{
    try{
        const {phone} = req.body;
        await sendSMS(
            phone,
            "Your visitor pass has been generated successfully."
        );
      res.json({
        message: "SMS sent successfully"
      });
    }catch (error) {
        res.status(500).json({
            message: "Failed to send SMS"
        });
    }
};

module.exports = { sendVisitorSMS };