const Visitor = require('../models/visitorModel');
const Appointment  = require('../models/Appointment');
const Pass  = require('../models/Pass');

// Dashboard Report
const getDashboardReport = async(req, res) =>{
    try{
        const totalVisitors = await Visitor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const totalPasses = await Pass.countDocuments();

        const activePasses = await Pass.countDocuments({status: "active"});
        const expiredPasses = await Pass.countDocuments({status: "expired"});

        res.json({
            totalVisitors,
            totalAppointments,
            totalPasses,
            activePasses,
            expiredPasses
        });
    }catch(error){
        res.status(500).json({ 
                    message: "Failed to generate report",
                    error: error.message
                 });
    }
};

//   Daily Visitor Report
const getTodayVisitors = async(req, res) =>{
    try{
        const today = new Date().toISOString().split("T")[0];

        const visitors = await Visitor.find({
            date: today
        });

        res.json(visitors);
    }catch (error) {
        res.status(500).json({
            message: "Error fetching today visitors"
        });
    }
};

// Pass Status Report

const getPassReport = async(req, res) =>{
    try{
        const passes = await Pass.find()
        .populate("visitor")
        .populate("appointment");
        res.json(passes);
    }catch(error){

        console.log(error); 
        res.status(500).json({
            message: "Error fetching pass report"
        });
    }
};

module.exports = {
    getDashboardReport,
    getTodayVisitors,
    getPassReport
}