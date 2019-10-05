const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let permissionSchema = new Schema({
    permission_name: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('permission', permissionSchema);