const express = require('express');
const { createAppointment, getAppointments, getAppointmentById, updateAppointment, deleteAppointment } = require('../controllers/appointmentController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
/*
Create Appointment
*/
router.post('/',authMiddleware, roleMiddleware("admin", "employee"), createAppointment);


    /*
    Get All Appointment
    */
router.get('/',authMiddleware, roleMiddleware("admin","employee"), getAppointments);

    /*
    Get Single Appointment
    */

router.get('/:id',authMiddleware, roleMiddleware("admin","employee"),getAppointmentById);

    /**
     update Appoinment status
     */
router.put('/:id',authMiddleware, roleMiddleware("admin", "employee"), updateAppointment);

    /**
     Delete Appointment 
      */ 
     
router.delete('/:id',authMiddleware, roleMiddleware, deleteAppointment);


module.exports = router;
        