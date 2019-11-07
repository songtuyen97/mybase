const mongoose = require('mongoose');
let SCHEMA = mongoose.Schema;

let MessageTextSchema = new SCHEMA({
    message_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    content: {
        type: String,
        required: false
    },
    user_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    status_viewed: {
        status: {
            type: Boolean,
            default: false
        },
        who_id: [
            mongoose.Types.ObjectId
        ],
        date: {
            type: Date,
            required: false
        }
    },
    created_at: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('message_text', MessageTextSchema);