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
        if(accessToken !== undefined && accessToken !== null && accessToken.length > 0) {
            jsonWebToken.verify(accessToken, constants.encodeJWT, function(err, decode) {
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
                USER.findOne({_id: req.user_id, token: accessToken}, function(err, user) {
                    if(err) {
                        httpResponseUtil.generateResponse('ERROR_SERVER', false, err, res);
                        return;
                    }
                    if(user === undefined || user === null) {
                        httpResponseUtil.generateResponse('AUTH.TOKEN_INVALID', false, err, res);
                        return;
                    }
                    next();
                })
            })
        } else {
            // httpResponseUtil.generateResponse('AUTH.TOKEN_NOT_FOUND', false, null, res);
            next();
        }
    },
    verifyToken: function(req, res, next) {
        if(req.originalUrl === '/auth/login' || req.originalUrl === '/auth/register') {
            next();
            return;
        }
        if(req.user_id === undefined || req.user_id === null) {
            httpResponseUtil.generateResponse('AUTH.TOKEN_NOT_FOUND', false, null, res);
            return;
        }
        //check role....
        next();
    }
}
module.exports = middlewareUtil;