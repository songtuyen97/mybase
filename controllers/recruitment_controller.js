const express = require('express');
const FORM = require('../model/form');
const httpResponseUtil = require('../lib/http_response_Util');
const path = require('path');
let router = express.Router();

router.get('/forms', function(req, res) {
    
    FORM.aggregate([
        {
            $project: {
                _id: 1,
                title: 1,
                type_file: 1,
                note: 1
            }
        }
    ]).then(function(success) {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })

})
router.get('/forms/:id/:type_file/download', function(req, res) {
    let file_id = req.params['id'];
    let type_file = req.params['type_file'];
    console.log(file_id +'/'+
        type_file);
    res.sendFile(path.resolve(__dirname + '/../public/files/' + file_id + '.' + type_file), function(err) {
        console.log(err);
        // if(err) {
        //     httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        //     return;
        // }
        // httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
    

})
module.exports = router;