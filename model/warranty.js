const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let warrantySchema = new Schema({
    warranty_money: {
        type: Number,
        required: false
    },
    user_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    date: {
        type: Date,
        required: false
    },
    created_at: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('warranty', warrantySchema);