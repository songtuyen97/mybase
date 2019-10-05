const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let educationLevelSchema = new Schema({
    education_level_name: {
        type: String,
        required: false
    },
    education_level_code: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('education_level', educationLevelSchema);