const express = require('express');
const httpRequestUtil = require('../lib/http_request_Util');
const httpResponseUtil = require('../lib/http_response_Util');
const constants = require('../config/constants');
const USER = require('../model/user');
const bcrypt = require('bcrypt');
const async = require('async');
const dbUtil = require('../lib/db_Util');
const jwt = require('jsonwebtoken');
let router = express.Router();

router.post('/login', function(req, res) {
    httpRequestUtil.trimPropertiesOfBodyRequest(req);
    async.waterfall([
        function(callback) {
            const requiredFields = [
                'username',
                'password'
            ]
            let missingFields = [];
            requiredFields.forEach(function(elem) {
                if(req.body[elem] === undefined || req.body[elem] == null || req.body[elem] === '') {
                    missingFields.push(elem);
                }
            })
            if(missingFields.length > 0) {
                callback('COMMON.MISSING_DATA', missingFields);
                return;
            }
            callback(null);
        },
        //verify existing of username
        function(callback) {
            dbUtil.getDocumentWithCondition(
              { username: req.body["username"] },
              { first_name: 1, last_name: 1, middle_name: 1, username: 1, password: 1 },
              USER,
              function(user) {
                if (user === "ERROR_SERVER") {
                  callback("ERROR_SERVER");
                  return;
                }
                if (user === null || user === undefined) {
                  callback("AUTH.USER_NOT_FOUND");
                  return;
                }
                callback(null, user);
              }
            );
        },
        //compare password
        function(user, callback) {
            bcrypt.compare(req.body['password'], user.password, function(err) {
                if(err) {
                    callback('ERROR_SERVER');
                    return;
                }
                callback(null, user);
            })
        },
        //register token for user 
        function(user, callback) {
            user.password = undefined;
            let token = jwt.sign({_id: user._id}, constants.encodeJWT, { expiresIn: '600h' });
            USER.updateOne({_id: user._id}, {$set: {token: token}}, function(err) {
                if(err) {
                    callback('ERROR_SERVER');
                    return;
                }
                user.token = token;
                callback(null, user);
            })
        },
        /**
         * response successfully
         * @param {*} token 
         * @param {*} callback 
         */
        function(token, callback) {
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, token, res);
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.put('/logout', function(req, res) {
    USER.updateOne({ _id: req.user_id }, { $set: { token: "" } }, 
        function(err) {
            if(err) {
                httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
                return;
            }
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
        });
})
router.post('/register', function(req, res) {
    httpRequestUtil.trimPropertiesOfBodyRequest(req);

    async.waterfall([
        /**
         * check input data
         * @param {*} callback 
         */
        function(callback) {
            //check existion of data
            const requiredFields = [
                'username',
                'password',
                'repassword',
                'first_name'
            ]
            let missingFields = [];
            requiredFields.forEach(function(elem) {
                if(req.body[elem] == undefined || req.body[elem] === null || req.body[elem] === '') {
                    missingFields.push(elem);
                }
            })
            if(missingFields.length > 0) {
                callback('COMMON.MISSING_DATA', missingFields);
                return;
            }
            //check type of fields
            let wrongTypeOfFields = [];
            if(typeof req.body['username'] !== 'string' || req.body['username'].length < constants.minLengthUsername) {
                wrongTypeOfFields.push('username');
            }
            if(typeof req.body['password'] !== 'string' || req.body['password'].length < constants.minLengthPassword) {
                wrongTypeOfFields.push('password');
            }
            if(typeof req.body['repassword'] !== 'string' || req.body['repassword'].length < constants.minLengthPassword) {
                wrongTypeOfFields.push('repassword');
            }
            if(typeof req.body['first_name'] !== 'string') {
                wrongTypeOfFields.push('first_name');
            }
            if(wrongTypeOfFields.length > 0) {
                callback('COMMON.INVALID_DATA', wrongTypeOfFields);
                return;
            }
            callback(null);
        },
        /**
         * compare password/repassword
         * @param {*} callback 
         */
        function(callback) {
            if(req.body['password'] !== req.body['repassword']) {
                callback('COMMON.INVALID_DATA', 'repassword');
                return;
            }
            callback(null);
        },
        /**
         * check existing of username
         */
        function(callback) {
            dbUtil.getDocumentWithCondition({username: req.body['username']}, {_id: 1},USER, function(user) {
                if(user === 'ERROR_SERVER') {
                    callback('ERROR_SERVER');
                    return;
                }
                if(user) {
                    callback('USER.USERNAME_EXIST');
                    return;
                }
                callback(null);
            })
        },
        /**
         * create user document
         * @param {*} callback 
         */
        function(callback) {
            let hash = bcrypt.hashSync(req.body['password'], constants.saltRounds);
            req.body['password'] = hash;
        
            USER.create(req.body, function(err, result) {
                if(err) {
                    callback('ERROR_SERVER', err);
                    return;
                }
                callback(null);
            });
        },
        /**
         * creating is successfully
         */
        function() {
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
// router.get
module.exports = router;
