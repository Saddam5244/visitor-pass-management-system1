 const mongoose = require('mongoose');

 const Schema = mongoose.Schema;

 const visitorSchema = new Schema({
     name: {
         type: String,
         required: true
     },
     email: {
         type: String,
         required: true
     },
     phone: String,
     company: String,
     idNumber: String,
     photoUrl: String,
     createdAt: {
         type: Date,
         default: Date.now
     }
 }, {
     timestamps: true
 })

 module.exports = mongoose.model('visitor', visitorSchema)