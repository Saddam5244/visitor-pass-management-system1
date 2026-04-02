const mongoose = require('mongoose');

 const Schema = mongoose.Schema;

 const checkLogSchema = new Schema({
     visitor: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "visitor",
         required: true
     },
      pass: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "pass",
         required: false
     },
    checkInTime: {
        type : Date,
        default : Date.now
    },
    checkOutTime: {
        type : Date
    },
      status:{
        type: String,
        enum: ['checked-in', 'checked-out'],
        default: 'checked-in'
     }

     });

     module.exports = mongoose.model('checklog', checkLogSchema);