const mongoose = require('mongoose');
let SCHEMA = mongoose.Schema;

let MessageSchema = new SCHEMA({
    list_user_id: [mongoose.Types.ObjectId],
    type_message: {
        type: String,
        required: false
    },
    created_date: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('message', MessageSchema);