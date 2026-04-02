 const mongoose = require('mongoose');

 const Schema = mongoose.Schema;

 const appointmentSchema = new Schema({
     visitor: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "visitors",
         required: true
     },
      host: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "users",
         required: true
     },
     purpose:{
        type: String,
        required: true
     },
     date:{
        type: String,
        required: true
     },
     status:{
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved"
     },
     createdAt: {
         type: Date,
         default: Date.now
     }
 }, {
     timestamps: true
 })

 module.exports = mongoose.model("appointment", appointmentSchema)