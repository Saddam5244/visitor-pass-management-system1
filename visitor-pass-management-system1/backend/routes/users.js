const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { registerValidation, loginValidation} = require('../middleware/validationMiddleware');
const {registerUser, loginUser, OTPVerify} =  require('../controllers/authController');
router.post('/register', registerValidation, registerUser);
router.post('/login',loginValidation, loginUser);
router.post("/otpverify", OTPVerify);

//  get all users 
router.get('/',async(req, res) =>{
    try{
        const users =await User.find();
        res.json(users)
    }catch(error){
        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
});




module.exports = router;