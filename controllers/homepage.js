const express = require('express');
const USER = require('../model/user');
let router = express.Router();
// TEST
const httpResponseUtil = require('../lib/http_response_Util');

router.get('/', function(req, res) {
    res.status(200).json('this is homepage');
    // httpResponseUtil.generateResponseStatusCode('COMMON.MISSING_DATA');
    // httpResponseUtil.generateResponseMessage('COMMON.MISSING_DATA');
    let io = req.io;
    USER.findOne({_id: req.user_id}, function(err, user) {
        if(err || user === null) {
            console.log(user);
            return;
        }
        console.log('homepage:'+user.socket_id);
        io.to(user.socket_id).emit('message', 'Im superman!');
    })
    
})

module.exports = router;