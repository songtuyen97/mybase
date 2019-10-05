const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let positionSchema = new Schema({
    position_name: {
        type: String,
        required: false
    },
    position_code: {
        type: String,
        required: false
    },
    department_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    note: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('position', positionSchema);