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
    },
    // session_code: {
    //     type: String,
    //     required: false
    // },
    ismorning_session: {
        type: Boolean,
        required: false
    },
    hours: {
        type: Number,
        required: false
    },
    created_date: {
        type: Date,
        required: false
    },
    license: {
        type: Boolean,
        required: false
    }
})

module.exports = mongoose.model('day_off', dayOffSchema);