const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let dayOffSchema = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    date: {
        type: Date,
        required: false
    },
    note: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('day_off', dayOffSchema);