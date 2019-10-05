const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let notificationSchema = new Schema({
    title: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: false
    },
    create_at: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('notification', notificationSchema);