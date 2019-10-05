const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let khtdSchema = new Schema({
    khtd_name: {
        type: String,
        required: false
    },
    create_at: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('khtd', khtdSchema);