const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let typeEmployeeSchema = new Schema({
    type_employee_name: {
        type: String,
        required: false
    },
    type_employee_code: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('type_employee', typeEmployeeSchema);