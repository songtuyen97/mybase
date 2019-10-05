const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let departmentSchema = new Schema({
    department_name: {
        type: String,
        required: false
    },
    department_code: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('department', departmentSchema);