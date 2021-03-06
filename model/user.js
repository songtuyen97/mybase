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
    username: {
        required: true,
        type: String,
        minlength: 6 
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: Number,
        required: false
    },
    tokens: [
        String
    ],
    socket_notification_id: [
        String
    ],
    socket_chat_id: [
        String
    ],
    active_message: {
        active: {
            type: Boolean,
            required: false
        },
        date: {
            type: Date,
            required: false
        }
    },
    department_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    position_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    type_employee_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    education_level_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    dob: {
        type: Date,
        required: false
    },
    start_day: {
        type: Date,
        required: false
    },
    end_day: {
        type: Date,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    resident_address: {
        type: String,
        required: false
    },
    phonenumber: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    salary: {
        type: Number,
        required: false
    },
    nationality: {
        type: String,
        required: false
    },
    ethnic_group: {
        type: String,
        required: false
    },
    marriaged: {
        type: Boolean,
        required: false
    },
    identity_number: {
        type: Number,
        required: false
    },
    identity_at: {
        type: String,
        required: false
    },
    start_day: {
        type: Date,
        required: false
    },
    working: {
        type: Boolean,
        default: true
    },
    note: {
        type: String,
        required: false
    },
    create_at: {
        type: Date,
        required: false
    },
    updated_at: {
        type: Date,
        required: false
    },
    khtd_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    mentor_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    role_code: {
        type: String,
        required: false
    }
})
module.exports = mongoose.model('users', userSchema);