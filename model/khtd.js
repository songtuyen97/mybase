const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let khtdSchema = new Schema({
    khtd_name: {
        type: String,
        required: false
    },
    trimester: {
        type: Number,
        required: false
    },
    note: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('khtd', khtdSchema);