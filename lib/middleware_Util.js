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
                req.role_code = decode.role_code ? decode.role_code : constants.role_code.user;
                
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
        let trigger = socket.request._query['trigger'];
        if(accessToken !== undefined && accessToken !== null && accessToken.trim().length !== 0 &&
            feature !== null && feature !== undefined && feature.trim().length !== 0) {
            jsonWebToken.verify(accessToken, constants.encodeJWT, function(err, decode) {
                if(err || decode === null || decode === undefined) {
                    socket.disconnect(true);
                    return;
                }
                //save role...
                if(feature === 'chat') {
                    let newActiveMessage = {active: true, date: new Date()};
                    USER.findOneAndUpdate({_id: decode._id}, {$push: {socket_chat_id: socket.id}, $set: {active_message: newActiveMessage}}, function(err, user) {
                        if(err || user === undefined || user === null) {
                            socket.disconnect(true);
                            return;
                        }
                        socket.user_id = decode._id;
                        socket.type_socket = feature;
                        next();
                    })
                    if(trigger === 'true') {
                        USER.findOneAndUpdate({_id: decode._id}, {$push: {socket_notification_id: socket.id}}, function(err, user) {
                            if(err || user === undefined || user === null) {
                                socket.disconnect(true);
                                return;
                            }
                        })
                    }
                    return;
                } 
                if(feature === 'notification') {
                    USER.findOneAndUpdate({_id: decode._id}, {$push: {socket_notification_id: socket.id}}, function(err, user) {
                        if(err || user === undefined || user === null) {
                            socket.disconnect(true);
                            return;
                        }
                        socket.user_id = decode._id;
                        socket.type_socket = feature;
                        next();
                    })
                    return;
                }
                //if haven't 2 value above
                socket.disconnect(true);
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
                let type_Socket = '';
                if(socket.type_socket === 'chat') {
                    type_Socket = 'socket_chat_id';
                } else if(socket.type_socket === 'notification') {
                    type_Socket = 'socket_notification_id';
                }

                if(user[type_Socket] === undefined || user[type_Socket] === null) {
                    return;
                }
                //delete socketid in DB
                // let socketIDIndex = user[type_Socket].findIndex(function(elem) {
                //     return elem === socket.id;
                // })
                // user[type_Socket].splice(socketIDIndex, 1);
                let fieldsUpdating = {};
                fieldsUpdating[type_Socket] = user[type_Socket].filter(function(elem) {
                    return elem !== socket.id;
                })
                //set status active message
                if(type_Socket === 'socket_chat_id' && user[type_Socket].length === 0) {
                    fieldsUpdating['active_message'] = {active: false, date: new Date()};
                }
                //IF trigger === true delete socket id in socket_notificaiton_id
                fieldsUpdating['socket_notification_id'] = user['socket_notification_id'].filter(function(elem) {
                    return elem !== socket.id;
                })

                //update
                USER.findOneAndUpdate({_id: socket.user_id}, {$set: fieldsUpdating}, function(error, user_data) {
                        if(error) {
                            console.log('middleware 105:'+error);
                        }   
                })
                // let userUpdated = new USER(user);
                // userUpdated.save(function(err) {
                //     if(err) {
                //         console.log('middleware 105:'+err);
                //     }   
                // })
            })
        })
    }
}
module.exports = middlewareUtil;