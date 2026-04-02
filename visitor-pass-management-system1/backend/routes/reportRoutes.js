const express = require('express');
const router = express.Router();

const reportController = require("../controllers/reportController");
    /*
    Get Total visitors
    */
router.get('/dashboard',  reportController.getDashboardReport);
    /*
    Get Total Appointments
    */
router.get('/today-visitors', reportController.getTodayVisitors);
    /*
    Get Total Passes
    */

router.get('/passes', reportController.getPassReport);

module.exports = router;
        