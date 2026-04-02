const Appoitnment  = require('../models/Appointment');

/*
Create Appointment
*/
const createAppointment = async (req, res) => {
    try {
            const appointment = await Appoitnment.create(req.body);
            res.status(201).json({
                message: "Appoinment Created Successfully",
                data: appointment
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ 
                message: "Failed to create appointment"
            });
        }
    };

    /*
    Get All Appointment
    */

    const getAppointments = async (req, res) =>{
        try {
                const appointments = await Appoitnment.find()
                  .populate("visitor")
                  .populate("employee");
                res.status(200).json(appointments);
        
            } catch (error) {
                res.status(500).json({ 
                    message: "Failed to fetch appointments"
                 });
            }
    }

    /*
    Get Single Appointment
    */

    const getAppointmentById = async (req, res) =>{
        try{

        const appointment = await Appoitnment.findById(req.params.id)
            .populate("visitor")
            .populate("employee");

            if(!appointment){
                return res.status(404).json({
                    message: "Appointment not found"
                });
            }
        res.status(200).json(appointment);

    } catch (error) {

        res.status(500).json({ 
            message: "Error fetching appointment"
        });
    }
    };

    /**
     update Appoinment status
     */

     const updateAppointment = async(req, res) =>{
        try {
             const appointment = await Appoitnment.findByIdAndUpdate(
                 req.params.id,
                 req.body,
                 {new: true}
             );
             res.status(200).json({
                 message: "Appointment updated Successfully",
                 data: appointment
             });
         } catch (error) {
            console.log(error);
             res.status(500).json({ 
                 message: "Failed to update appointment",
                 error: error.message
                   });
             }
     }

     /**
     Delete Appointment 
      */ 

     const deleteAppointment = async(req, res) =>{
           try {
                const appointment = await Appoitnment.findByIdAndDelete(req.params.id);
                res.status(200).json({
                    message: "Appointment deleted",
                    data: appointment
                })
            } catch (error) {
                res.status(500).json({ 
                    message: "Failed to delete appointment"
                 });
            }
     }

     module.exports = {
        createAppointment,
        getAppointments,
        getAppointmentById,
        updateAppointment,
        deleteAppointment
     }
