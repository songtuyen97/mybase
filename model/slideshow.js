const mongoose = require('mongoose');
const SCHEMA = require('mongoose').Schema;

let slideshowSchema = new SCHEMA({
    uri: {
        type: String,
        required: false
    },
    created_at: {
        type: Date, 
        required: false
    }
})

module.exports = mongoose.model('slideshow', slideshowSchema);