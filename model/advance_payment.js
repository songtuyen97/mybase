const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let advancePaymentSchema = new Schema({
    advance_payment_money: {
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

module.exports = mongoose.model('advance_payment', advancePaymentSchema);