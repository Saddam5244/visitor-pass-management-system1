 const mongoose = require('mongoose');

 const Schema = mongoose.Schema;

 const passSchema = new Schema({
     visitor: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "visitor",
         required: true
     },
      appointment: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "appointment",
         required: true
     },
     passNumber:{
        type: String,
        required: true,
        unique: true
     },
      validFrom: Date,

     validTo: Date,
     
    qrCode: {
        type: String
    },
     date:{
        type: String,
        required: true
     },
     status:{
        type: String,
        enum: ["active", "expired", "used"],
        default: "active"
     },
    
 }, {
     timestamps: true
 })

 module.exports = mongoose.model("pass", passSchema);