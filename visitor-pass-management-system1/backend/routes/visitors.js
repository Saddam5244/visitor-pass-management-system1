const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {visitorValidation} = require('../middleware/validationMiddleware');
const {createVisitor,getVisitors, getVisitorById, updateVisitor, deleteVisitor, getLatestVisitor} = require('../controllers/visitorController');
const Visitor = require("../models/visitorModel");
/**
 * Routes: /api/visiter
 * Method: POST
 * Description: Create/Add a new visitor
 * Access: Public
 * Parameters: None
 */
router.post('/',authMiddleware, roleMiddleware("admin","employee", "visitor"), visitorValidation, createVisitor);

/**
 * Routes: /api/visiter
 * Method: GET
 * Description: Get all Viistors
 * Access: Public
 * Parameters: None
 */
router.get('/',authMiddleware, roleMiddleware("admin", "employee"), getVisitors);


/**
 * Routes: /api/visitor/latest
 * Method: GET
 * Description: Get a latest visitors
 * Access: Public
 * Parameters: latest
 */
router.get(
  "/latest",
  authMiddleware,
  roleMiddleware("admin", "employee", "visitor"), 
  getLatestVisitor
);

/**
 * Routes: /api/visitor/verify
 * Method: post
 * Description: Get a verify visitors
 * Access: Public
 * Parameters: latest
 */
router.post(
  "/verify",
  authMiddleware,
  roleMiddleware("admin","security", "employee"),
  async (req, res) => {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ message: "Visitor ID required" });
    }

    const visitor = await Visitor.findById(visitorId);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    console.log("Visitor Verified:", visitor.name, visitor.phone);

    return res.json({
      message: "Entry Allowed ✅",
      visitor,
    });
  }
);

/**
 * Routes: /api/visiter/:id
 * Method: GET
 * Description: Get a single visiters by its id
 * Access: Public
 * Parameters: id
 */
router.get('/:id',authMiddleware, roleMiddleware("admin", "employee"), getVisitorById);


/**
 * Routes: /api/visiter/:id
 * Method: put
 * Description: update visitor
 * Access: Public
 * Parameters: /:id
 */
router.put('/:id',authMiddleware, roleMiddleware("admin"),visitorValidation, updateVisitor);

/**
 * Routes: /api/visiter/:id
 * Method: delete
 * Description: Delete visitor
 * Access: Public
 * Parameters: /:id
 */
router.delete('/:id',authMiddleware, roleMiddleware("admin"), deleteVisitor);



module.exports = router;