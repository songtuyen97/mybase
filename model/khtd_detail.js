const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let khtdDetailSchema = new Schema({
    khtd_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    number: {
        type: Number,
        required: false
    },
    number_man: {
        type: Number,
        required: false
    },
    department_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    position_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    min_salary: {
        type: Number,
        required: false
    },
    max_salary: {
        type: Number,
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
    speciality_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    language_level: {
        type: String,
        required: false
    },
    licensed: {
        type: Boolean,
        required: false
    },
    experience_year: {
        type: Number,
        required: false
    },
    // different_required: {
    //     type: String,
    //     required: false
    // },
    note: {
        type: String,
        required: false
    },
    age_from: {
        type: Number,
        required: false
    },
    age_to: {
        type: Number,
        required: false
    },
    created_at: {
        type: Date,
        required: false
    }
})
module.exports = mongoose.model('khtd_detail', khtdDetailSchema);