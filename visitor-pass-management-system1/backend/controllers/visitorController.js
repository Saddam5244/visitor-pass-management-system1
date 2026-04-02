const Visitor = require('../models/visitorModel');

/**
 * Routes: /api/visiter
 * Method: POST
 * Description: Create/Add a new visitor
 * Access: Public
 * Parameters: None
 */


const createVisitor = async (req, res) =>{
     try {
            const visitor = await Visitor.create(req.body);
            res.status(201).json({
                message: "Visitor registered successfully",
                data: visitor
            });
        } catch (error) {
            res.status(400).json({ 
                message: "Failed to register visitor"
            });
        }
}

/**
 * Routes: /api/visiter
 * Method: GET
 * Description: Get all Viistors
 * Access: Public
 * Parameters: None
 */

const getVisitors = async(req, res) =>{
     try {
    
            const visitors = await Visitor.find();
    
            res.status(200).json(visitors);
    
        } catch (error) {
    
            res.status(500).json({ message: "Failed to fetch visitors" });
    
        }
}

/**
 * Routes: /api/visiter/:id
 * Method: GET
 * Description: Get a single visiters by its id
 * Access: Public
 * Parameters: id
 */


const getVisitorById = async(req, res) =>{
     try {
             const visitor = await Visitor.findById(req.params.id);
             if(!visitor){
            return res.status(404).json({
                message: "Visitor not found"
             });
            }
             res.json(visitor);
      
         } catch (error) {
     
             res.status(500).json({ 
                 message: "Error fetching visitor"
             });
         }
};

/**
 * Routes: /api/visiter/:id
 * Method: put
 * Description: update visitor
 * Access: Public
 * Parameters: /:id
 */

const updateVisitor = async(req, res) =>{
    try {
            const visitor = await Visitor.findByIdAndUpdate(
                req.params.id,
                req.body,
                {new: true}
            );
            res.status(200).json({
                message: "Visitor updated",
                data: visitor
            });
        } catch (error) {
            res.status(500).json({ 
                message: "Failed to update visitor"
             });
        }
    }
  /**
 * Routes: /api/visiter/:id
 * Method: DELETE
 * Description: delete visitor
 * Access: Public
 * Parameters: /:id
 */

  const deleteVisitor = async(req, res) =>{
     try {
            const visitor = await Visitor.findByIdAndDelete(req.params.id);
            res.status(200).json({
                message: "Visitor deleted successfully",
                data: visitor
            });
        } catch (error) {
            res.status(500).json({ 
                message: "Failed to delete visitor"
             });
        }
  }


const getLatestVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findOne().sort({ createdAt: -1 });

        res.json(visitor);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching visitor"
        });
    }
};

  module.exports ={
     createVisitor,
     getVisitors,
     getVisitorById,
     updateVisitor,
     deleteVisitor,
     getLatestVisitor
  };
