const express = require('express');
const httpRequestUtil = require('../lib/http_request_Util');
const httpResponseUtil = require('../lib/http_response_Util');
const constants = require('../config/constants');
const USER = require('../model/user');
const bcrypt = require('bcrypt');
const async = require('async');
const dbUtil = require('../lib/db_Util');
const jwt = require('jsonwebtoken');
const objectID = require('mongoose').Types.ObjectId;
const DEPARTMENT = require('../model/department');
const POSITION = require('../model/position');
const TYPE_EMPLOYEE = require('../model/type_employee');
const EDUCATION_LEVEL = require('../model/education_level');
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
            bcrypt.compare(req.body['password'], user.password, function(err, isSame) {
                if(err) {
                    callback('ERROR_SERVER');
                    return;
                }
                if(isSame === false) {
                  callback('COMMON.INVALID_DATA', ['password']);
                  return;
                }
                callback(null, user);
            })
        },
        //register token for user 
        function(user_Base, callback) {
            user_Base.password = undefined;
            let token = jwt.sign({_id: user_Base._id}, constants.encodeJWT, { expiresIn: '600h' });
            USER.findOne({_id: user_Base._id}, function(err, user) {
                if(err) {
                    callback('ERROR_SERVER');
                    return;
                }
                if(user.tokens.length >= 2) {
                    user.tokens[0] = user.tokens[1];
                    user.tokens[1] = token;
                }
                if(user.tokens.length < 2) {
                    user.tokens.push(token);
                }
                if(user.tokens === undefined || user.tokens === null) {
                    user.tokens = [token];
                }
                let userUpdated = new USER(user);
                userUpdated.save(function(err) {
                    if(err) {
                        callback('ERROR_SERVER');
                        return;
                    }
                    user_Base.tokens = token;
                    callback(null, user_Base);
                })
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
    async.waterfall([
        function(callback) {
            USER.findOne({_id: req.user_id}, function(err, user) {
                if(err || user === undefined || user === null || user.tokens === undefined || user.tokens === null) {
                    callback('ERROR_SERVER')
                    return;
                }
                let indexToken = user.tokens.findIndex(function(token) {
                    return token === req.token;
                })
                if(indexToken === -1) {
                    callback('AUTH.TOKEN_INVALID');
                    return;
                }
                user.tokens.splice(indexToken, 1);
                let userUpdated = new USER(user);
                userUpdated.save(function(err) {
                    if(err) {
                        callback('ERROR_SERVER');
                        return;
                    }
                    httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
                })
            })
        }
    ], function(err, result) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.post('/register', function(req, res) {
    httpRequestUtil.trimPropertiesOfBodyRequest(req);

    async.waterfall(
      [
        /**
         * check input data
         * @param {*} callback
         */
        function(callback) {
          //check existion of data
          const requiredFields = [
            "username",
            "password",
            "repassword",
            "first_name",
            "department_id",
            "position_id",
            "type_employee_id",
            "phonenumber",
            "start_day"
          ];
          let missingFields = [];
          requiredFields.forEach(function(elem) {
            if (
              req.body[elem] == undefined ||
              req.body[elem] === null ||
              req.body[elem] === ""
            ) {
              missingFields.push(elem);
            }
          });
          if (missingFields.length > 0) {
            callback("COMMON.MISSING_DATA", missingFields);
            return;
          }
          //check type of fields
          let wrongTypeOfFields = [];
          if (
            typeof req.body["username"] !== "string" ||
            req.body["username"].length < constants.minLengthUsername
          ) {
            wrongTypeOfFields.push("username");
          }
          if (
            typeof req.body["password"] !== "string" ||
            req.body["password"].length < constants.minLengthPassword
          ) {
            wrongTypeOfFields.push("password");
          }
          if (
            typeof req.body["repassword"] !== "string" ||
            req.body["repassword"].length < constants.minLengthPassword
          ) {
            wrongTypeOfFields.push("repassword");
          }
          if (
            typeof req.body["start_day"] !== "string"
            // req.body["start_day"].length < constants.minLengthUsername
          ) {
            wrongTypeOfFields.push("start_day");
          }
          if (
            typeof req.body["phonenumber"] !== "string"
          ) {
            wrongTypeOfFields.push("phonenumber");
          }
          if (typeof req.body["first_name"] !== "string") {
            wrongTypeOfFields.push("first_name");
          }
          if (objectID.isValid(req.body["department_id"]) === false) {
            wrongTypeOfFields.push("department_id");
          }
          if (objectID.isValid(req.body["position_id"]) === false) {
            wrongTypeOfFields.push("position_id");
          }
          if (objectID.isValid(req.body["type_employee_id"]) === false) {
            wrongTypeOfFields.push("type_employee_id");
          }
          if (req.body["education_level_id"] && objectID.isValid(req.body["education_level_id"]) === false) {
            wrongTypeOfFields.push("education_level_id");
          }
          if (wrongTypeOfFields.length > 0) {
            callback("COMMON.INVALID_DATA", wrongTypeOfFields);
            return;
          }
          callback(null);
        },
        /**
         * compare password/repassword
         * @param {*} callback
         */
        function(callback) {
          if (req.body["password"] !== req.body["repassword"]) {
            callback("COMMON.INVALID_DATA", "repassword");
            return;
          }
          callback(null);
        },
        /**
         * check existing of username
         */
        function(callback) {
          dbUtil.getDocumentWithCondition(
            { username: req.body["username"] },
            { _id: 1 },
            USER,
            function(user) {
              if (user === "ERROR_SERVER") {
                callback("ERROR_SERVER");
                return;
              }
              if (user) {
                callback("USER.USERNAME_EXIST");
                return;
              }
              callback(null);
            }
          );
        },
        /**
         * check exist of department_id
         */
        function(callback) {
          DEPARTMENT.findById({ _id: objectID(req.body["department_id"]) }, function(err, department) {
            if (err) {
              callback("ERROR_SERVER", null);
              return;
            }
            if (department === null) {
              callback("COMMON.INVALID_DATA", "department_id");
              return;
            }
            callback(null);
          });
        },
        /**
         * check exist of position_id
         */
        function(callback) {
          POSITION.findOne({ _id: req.body["position_id"] }, function(err,position) {
            if (err) {
              callback("ERROR_SERVER", null);
              return;
            }
            if (position === null) {
              callback("COMMON.INVALID_DATA", "position_id");
              return;
            }
            callback(null);
          });
        },
        /**
         * check exist of type_employee_id
         */
        function(callback) {
          TYPE_EMPLOYEE.findOne({ _id: req.body["type_employee_id"] }, function(err, department) {
            if (err) {
              callback("ERROR_SERVER", null);
              return;
            }
            if (department === null) {
              callback("COMMON.INVALID_DATA", "type_employee_id");
              return;
            }
            callback(null);
          });
        },
        /**
         * check exist of type_employee_id
         */
        function(callback) {
          if(!req.body["education_level_id"]) {
            callback(null);
            return;
          }
          EDUCATION_LEVEL.findOne({ _id: req.body["education_level_id"] }, function(err, department) {
            if (err) {
              callback("ERROR_SERVER", null);
              return;
            }
            if (department === null) {
              callback("COMMON.INVALID_DATA", "education_level_id");
              return;
            }
            callback(null);
          });
        },
        /**
         * create user document
         * @param {*} callback
         */
        function(callback) {
          let hash = bcrypt.hashSync(
            req.body["password"],
            constants.saltRounds
          );
          req.body["password"] = hash;

          USER.create(req.body, function(err, result) {
            if (err) {
              callback("ERROR_SERVER", err);
              return;
            }
            callback(null);
          });
        },
        /**
         * creating is successfully
         */
        function() {
          httpResponseUtil.generateResponse(
            "COMMON.SUCCESSFULLY",
            true,
            null,
            res
          );
        }
      ],
      function(err, data) {
        if (typeof err === "string") {
          httpResponseUtil.generateResponse(err, false, data, res);
        } else {
          httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
        }
      }
    );
})
// router.get
module.exports = router;
