const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let probationarySchema = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    start_day: {
        type: String,
        required: false
    },
    end_day: {
        type: String,
        required: false
    },
    manager_id: {
        type: mongoose.Types.ObjectId,
        required: false
    }
})

module.exports = mongoose.model('probationary', probationarySchema);