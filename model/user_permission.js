const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userPermissionSchema = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    permission_id: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    licensed: {
        type: Boolean,
        required: false
    }
})

module.exports = mongoose.model('user_permission', userPermissionSchema);