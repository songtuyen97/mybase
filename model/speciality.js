const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let specialitySchema = new Schema({
    speciality_name: {
        type: String,
        required: false
    },
    speciality_code: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('speciality', specialitySchema);