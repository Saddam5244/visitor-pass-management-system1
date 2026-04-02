const express = require("express");
const router = express.Router();

const { sendPassEmail} = require("../controllers/passController");

router.post("/send-email", sendPassEmail);

module.exports = router;