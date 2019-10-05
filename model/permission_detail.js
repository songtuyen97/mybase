const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let permissionDetailSchema = new Schema({
    permission_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    action_name: {
        type: String,
        required: false
    },
    action_code: {
        type: String,
        required: false
    },
    check_action: {
        type: Boolean,
        required: false
    }
})

module.exports = mongoose.model('permission_detail', permissionDetailSchema);