const express = require("express");
const router = express.Router();

const {sendVisitorSMS} = require("../controllers/smsController");

router.post("/send-sms", sendVisitorSMS);

module.exports = router;