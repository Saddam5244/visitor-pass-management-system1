const express = require('express');
const { createPass, getPasses, getPassById, deletePass, createPassQR } = require('../controllers/passController');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
require('../routes/visitors');

/*
Create pass
*/
router.post('/generate', createPassQR);

/*
Create pass
*/
router.post('/',authMiddleware, roleMiddleware("admin", "employee"), createPass);

    /*
    Get All pass
    */
router.get('/',authMiddleware, roleMiddleware("admin", "employee"), getPasses);

    /*
    Get Single pass
    */
router.get('/:id',authMiddleware, roleMiddleware("admin", "employee"), getPassById);

    /**
     Delete pass
      */  
router.delete('/:id',authMiddleware, roleMiddleware("admin"), deletePass);


module.exports = router;
        