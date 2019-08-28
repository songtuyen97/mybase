const messagekeys = require('../config/response_message_key');
const messages = require('../config/response_message');
let httpResponseUtil = {
    generateResponseStatusCode: function(key) {
        if(!key) {
            return null;
        }
        let keys = key.split('.');
        let messagekeys_ = messagekeys;
        keys.forEach(function(element) {
            messagekeys_ = messagekeys_[element];
        })
        return messagekeys_.HTTP_CODE;
    },
    generateResponseCode: function(key) {
        if(!key) {
            return null;
        }
        let keys = key.split('.');
        let messagekeys_ = messagekeys;
        keys.forEach(function(element) {
            messagekeys_ = messagekeys_[element];
        })
        return messagekeys_.CODE;
    },
    generateResponseMessage: function(key) {
        if(!key) {
            return null;
        }
        let keys = key.split('.');
        let messages_ = messages;
        keys.forEach(function(element) {
            messages_ = messages_[element];
        })
        return messages_;
    },
    generateTimeResponse: function() {
        let date = new Date();
        return date;
    },
    generateResponseSuccess: function(key, data) {
        return {
            'status': true,
            'code': httpResponseUtil.generateResponseCode(key),
            'message': httpResponseUtil.generateResponseMessage(key),
            'data': data,
            'time': httpResponseUtil.generateTimeResponse()
        }
    },
    generateResponseError: function(key, data) {
        return {
            'status': false,
            'code': httpResponseUtil.generateResponseCode(key),
            'message': httpResponseUtil.generateResponseMessage(key),
            'data': data,
            'time': httpResponseUtil.generateTimeResponse()
        }
    },
    generateResponse: function(key, success, data, res) {
        let response_ = null;
        if(success === false) {
            response_ = httpResponseUtil.generateResponseError(key, data);
        } else {
            response_ = httpResponseUtil.generateResponseSuccess(key, data);
        }
        let statusCode = httpResponseUtil.generateResponseStatusCode(key);
        return res.status(statusCode).json(response_);
    }
}
module.exports = httpResponseUtil;