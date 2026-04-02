const Joi = require('joi');

const registerValidation = (req,res, next) =>{
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required(),
        role: Joi.string().valid('admin', 'security', 'employee', 'visitor').required(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
        department: Joi.string().min(2).max(100).required()
    });
    
    const {error} = schema.validate(req.body);
    if(error){
        return res.status(400)
        .json({message: error.details[0].message

        });
    }
    next();
};

const loginValidation = (req,res, next) =>{
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required()
    });
    const {error} = schema.validate(req.body);

    if(error){
        return res.status(400)
        .json({ message: error.details[0].message})
    }
    next();
}

const visitorValidation = (req, res, next) =>{
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
        purpose: Joi.string().min(3).max(200).required()
    });
    
    const {error} = schema.validate(req.body, { abortEarly: true });
    if(error){
        return res.status(400)
        .json({message: error.details[0].message

        });
    }
    next();
};


module.exports = {
    registerValidation,
    loginValidation,
    visitorValidation  
}