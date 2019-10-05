'use strict';
const jsonWebToken = require('jsonwebtoken');
const constants = require('../config/constants');
const httpResponseUtil = require('./http_response_Util');
const USER = require('../model/user');
let middlewareUtil = {
    /**
     * check existing of token to handle
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    accessToken: function(req, res, next) {
        let accessToken = req.headers['access-token'];
        req.token = accessToken;
        next();
    },
    verifyToken: function(req, res, next) {
        if(req.originalUrl === '/auth/login' || req.originalUrl === '/auth/register' || req.originalUrl === '/') {
            next();
            return;
        }
        if(req.token !== undefined && req.token !== null && req.token.length > 0) {
            jsonWebToken.verify(req.token, constants.encodeJWT, function(err, decode) {
                if(err) {
                    httpResponseUtil.generateResponse('ERROR_SERVER', false, err, res);
                    return;
                }
                if(decode === null || decode === undefined) {
                    httpResponseUtil.generateResponse('AUTH.TOKEN_INVALID', false, err, res);
                    return;
                }
                req.user_id = decode._id;
                //save role...
                USER.findOne({_id: req.user_id}, function(err, user) {
                    if(err) {
                        httpResponseUtil.generateResponse('ERROR_SERVER', false, err, res);
                        return;
                    }
                    if(user === undefined || user === null) {
                        httpResponseUtil.generateResponse('AUTH.TOKEN_INVALID', false, err, res);
                        return;
                    }
                    if(user.tokens === undefined || user.tokens === null) {
                        httpResponseUtil.generateResponse('AUTH.TOKEN_INVALID', false, err, res);
                        return;
                    }
                    let existToken = user.tokens.includes(req.token);
                    if(existToken === false) {
                        httpResponseUtil.generateResponse('AUTH.TOKEN_INVALID', false, err, res);
                        return;
                    }
                    next();
                })
            })
        } else {
            httpResponseUtil.generateResponse('AUTH.TOKEN_INVALID', false, null, res);
        }
        //check role....
    },
    accessAndVerifyTokenSocketIO: function(socket, next) {
        //test
        let accessToken = socket.request._query['access-token'];
        let feature = socket.request._query['feature'];
        if(accessToken !== undefined && accessToken !== null && accessToken.length > 0) {
            jsonWebToken.verify(accessToken, constants.encodeJWT, function(err, decode) {
                if(err || decode === null || decode === undefined) {
                    socket.disconnect(true);
                    return;
                }
                //save role...
                USER.findOneAndUpdate({_id: decode._id}, {$push: {socket_id: socket.id}}, function(err, user) {
                    if(err || user === undefined || user === null) {
                        socket.disconnect(true);
                        return;
                    }
                    socket.user_id = decode._id;
                    next();
                })
            })
        } else {
            socket.disconnect(true);
        }

        socket.on('disconnect', function(data) {
            USER.findOne({_id: socket.user_id}, function(err, user) {
                if(err) {
                    // socket.disconnect(true);
                    return;
                }
                if(user.socket_id === undefined || user.socket_id === null) {
                    return;
                }
                // user.socket_id.forEach(function(elem) {

                // })
                let socketIDIndex = user.socket_id.findIndex(function(elem) {
                    return elem === socket.id;
                })
                user.socket_id.splice(socketIDIndex, 1);

                let userUpdated = new USER(user);
                userUpdated.save(function(err) {
                    if(err) {
                        console.log('middleware 105:'+err);
                    }   
                })
            })
        })
    }
}
module.exports = middlewareUtil;