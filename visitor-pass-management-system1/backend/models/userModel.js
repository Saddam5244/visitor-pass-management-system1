const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    passwordHash:{
        type: String,
        required: true
    },
    role: { 
        type: String,
        enum: ['admin', 'security', 'employee', 'visitor'], 
        default: 'visitor' 
    },
    phone: String,
    department: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    otp: String,
isVerified: {
  type: Boolean,
  default: false
}
});

module.exports = mongoose.model('User', userSchema)