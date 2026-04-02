const express = require('express');
const router = express.Router();
const CheckLog = require('../models/CheckLog');


// Visitor Check-In
router.post('/', async (req, res) => {

    try {
        console.log("BODY: ", req.body);
        const checklog = await CheckLog.create({
            visitor: req.body.visitor,
            status: req.body.status,
            checkInTime: req.body.checkInTime
        });

        res.status(201).json({
            message: "Visitor checked-in",
            data: checklog
        });

    } catch (error) {
        console.log("ERROR: ", error);
        
        res.status(500).json({
            message: "Check-in failed"
        });

    }

});


// Visitor Check-Out
router.put('/:id', async (req, res) => {

    try {

        const log = await CheckLog.findByIdAndUpdate(
            req.params.id,
            {
                status: "checked-out",
                checkOutTime: Date.now()
            },
            { new: true }
        );
        
        res.json({
            message: "Visitor checked-out",
            data: log
        });

    } catch (error) {
        res.status(500).json({
            message: "Check-out failed"
        });
    }
});


// Get all logs
router.get('/', async (req, res) => {

    const logs = await CheckLog.find()
        .populate('visitor');
        // .populate('pass');
        res.json(logs);
});

module.exports = router;