const { date } = require('joi');
const Pass  = require('../models/Pass');
const generateQR = require('../utils/generateQR');
 const sendEmail = require('../utils/sendEmail');
/*
Create pass
*/

const createPass = async (req, res) =>{
    try {
            const pass = await Pass.create(req.body);
            res.status(201).json({
                message: "Pass Created successfully",
                data: pass
            });
        } catch (error) {
            console.log("Error:", error);
            res.status(500).json({ 
                message: "Failed to generate pass",
                error: error.message
            });
        }
};

 /*
    Get All pass
    */

    const getPasses = async (req, res) =>{
           try {
        const passes = await Pass.find()
            .populate('visitor')
            .populate('appointment');

        res.json(passes);

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch passes"
        });

    }
    }

    /*
    Get Single pass
    */

    const getPassById = async(req, res) =>{
        try{

        const pass = await Pass.findById(req.params.id)
            .populate("visitor")
            .populate("appointment");
        res.status(200).json(pass);

    } catch (error) {

        res.status(500).json({ 
            message: "pass not found"
        });
    }
    }

    /**
     Delete delete 
      */ 
    const deletePass = async (req, res) =>{
         try {
                const pass = await Pass.findByIdAndDelete(req.params.id);
                res.status(200).json({
                    message: "Pass deleted",
                    data: pass
                })
            } catch (error) {
                res.status(500).json({ 
                    message: "Failed to delete pass"
                 });
            }
    }

    //  Create QR Code
const createPassQR = async (req, res) =>{
    try{
        const passData = {
            visitorName: req.body.name,
        visitorEmail: req.body.email,
        purpose: req.body.purpose,
        date: new Date()
        }
   const qrCode = await generateQR(passData);

   res.status(200).json({
    message: "QR Code generated successfully",
    qrCode: qrCode
   });
}catch(error){
    res.status(500).json({
        message: "Failed to generate QR Code"
    });
}
}

//  Send Email

const sendPassEmail = async(req, res) =>{
    try{
        const {email, name} = req.body;

        await sendEmail(
            email,
            "Visitor Pass Confirmation",
            `Hello ${name}, your visitor Pass has been created succesfilly. `
        );
        res.json({
            message: "Email sent successfully"
        });
    }catch(error) {
        res.status(500).json({
            message: "Failed to send email"
        }); 
    }
}

    module.exports = {
        createPass,
        getPasses,
        getPassById,
        deletePass,
        createPassQR,
        sendPassEmail
    };