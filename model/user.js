const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
    first_name: {
        required: false,
        type: String
    },
    last_name: {
        required: false,
        type: String
    },
    middle_name: {
        type: String,
        default: ''
    },
    username: {
        required: true,
        type: String,
        minlength: 6 
    },
    password: {
        type: String,
        required: true
    },
    token: {
        required: false,
        type: String
    }
})
module.exports = mongoose.model('users', userSchema);