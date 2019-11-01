const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let formSchema = new Schema({
    title: {
        type: String,
        required: false
    },
    type_file: {
        type: String,
        required: false
    },
    note: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: new Date()
    }
})

module.exports = mongoose.model('form', formSchema);