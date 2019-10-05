const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let dayOTSchema = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    date: {
        type: Date,
        required: false
    },
    hours: {
        type: Number,
        required: false
    },
    note: {
        type: String,
        required: false
    },
    coefficient: {
        type: Number,
        required: false
    }
})

module.exports = mongoose.model('day_ot', dayOTSchema);