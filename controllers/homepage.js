const express = require('express');
let router = express.Router();
// TEST
const httpResponseUtil = require('../lib/http_response_Util');

router.get('/', function(req, res) {
    res.status(200).json('this is homepage');
    httpResponseUtil.generateResponseStatusCode('COMMON.MISSING_DATA');
    httpResponseUtil.generateResponseMessage('COMMON.MISSING_DATA');
})

module.exports = router;