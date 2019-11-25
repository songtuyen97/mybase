const express = require('express');
const generalUtil = require('../lib/general_Util');
const USER = require('../model/user');
const httpResponseUtil = require('../lib/http_response_Util');
const httpRequestUtil = require('../lib/http_request_Util');
const validator = require('validator');
const async = require('async');
const objectID = require('mongoose').Types.ObjectId;
const DEPARTMENT = require('../model/department');
const POSITION = require('../model/position');
const TYPE_EMPLOYEE = require('../model/type_employee');
const EDUCATION_LEVEL = require('../model/education_level');
const multer = require('multer');
const path = require('../config/path');
const constants = require('../config/constants');
const bcrypt = require('bcrypt');
let router = express.Router();

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/avatar');
    },
    filename: function(req, file, cb) {
        let user_id = req.params['user_id'];
        let typeFile = file.originalname.split('.');
        if(typeFile[typeFile.length - 1] !== 'jpg' && typeFile[typeFile.length - 1] !== 'png') {
            cb('COMMON.INVALID_DATA');
            return;
        }
        let fileName = path.avatar + '_' + user_id;
        cb(null, fileName);
    }
})
let upload = multer({
    storage: storage,
    // fileFilter: function(req, file, cb) {

    // }
}).single('avatar');
router.put('/:user_id/avatar', function(req, res) {
    let user_id = req.params['user_id'];
    async.waterfall([
        /**
         * check existing of user_id
         * @param {*} callback 
         */
        function(callback) {
            if(objectID.isValid(user_id) === false) {
                callback('COMMON.INVALID_DATA', 'user_id');
                return;
            }
            USER.findOne({_id: user_id}, function(err, user) {
                if(err) {
                    callback('ERROR_SERVER');
                    return;
                }
                if(user === null) {
                    callback('COMMON.INVALID_DATA', 'user_id');
                    return;
                }
                callback(null);
            })
        },
        /**
         * upload image
         * @param {*} callback 
         */
        function(callback) {
            upload(req, res, function(err) {
                if(err) {
                    callback(err, null);
                    return;
                }
                if(req.file === undefined) {
                    callback('COMMON.INVALID_DATA');
                    return;
                }
                let fileName = req.file.filename;
                let uriAvatar = '/' + path.avatar + '/' + fileName;
                
                USER.updateOne({_id: user_id}, {$set: {avatar: uriAvatar}}, function(err) {
                    if(err) {
                        callback('ERROR_SERVER');
                        return;
                    }
                    callback(null);
                })
            })
        },
        /**
         * 
         */
        function(callback) {
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
router.get('/', function(req, res) {
    USER.aggregate(
        [
        {
            $match: {
                _id: {$ne: objectID(req.user_id)}
            }
        },
        {
            $project: {
                first_name: 1,
                last_name: 1,
                username: 1,
                department_id: 1,
                position_id: 1,
                type_employee_id: 1,
                avatar: 1,
                dob: 1,
                address: 1,
                resident_address: 1,
                phonenumber: 1,
                email: 1,
                nationality: 1,
                ethnic_group: 1,
                note: 1,
                working: 1,
                fullname: {$concat: ['$last_name', ' ', '$first_name']}
            }
        }].concat(queryBaseInformationAggregate(req))
    ).then(function(success) {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
})
router.get('/:user_id', function(req, res) {
    let user_id = req.params['user_id'];

    if(objectID.isValid(user_id) === false) {
        httpResponseUtil.generateResponse('COMMON.INVALID_DATA', false, 'user_id', res);
        return;
    }
    USER.aggregate(
    [
        {
            $match: {
                _id: objectID(user_id)
            }
        }
    ].concat(queryBaseInformationAggregate(req))
    ).then(function(user) {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, user, res);
    })
})
router.put('/:user_id', function(req, res) {
        let user_id = req.params['user_id'];
        httpRequestUtil.trimPropertiesOfBodyRequest(req);
        async.waterfall([
            /**
             * check existing of user_id
             * @param {*} callback 
             */
            function(callback) {
                if(objectID.isValid(user_id) === false) {
                    callback('COMMON.INVALID_DATA', 'user_id');
                    return;
                }
                USER.findOne({_id: user_id}, function(err, user) {
                    if(err) {
                        callback('ERROR_SERVER');
                        return;
                    }
                    if(user === null) {
                        callback('COMMON.INVALID_DATA', 'user_id');
                        return;
                    }
                    callback(null);
                })

            },
            /**
             * validate input field
             * @param {*} callback 
             */
            function(callback) {
                let inputedfields = [
                    'first_name',
                    'last_name',
                    // 'username',
                    'department_id',
                    'position_id',
                    'type_employee_id',
                    // 'avatar_url',
                    'dob',
                    'address',
                    'resident_address',
                    'phonenumber',
                    'email',
                    'nationality',
                    'ethnic_group',
                    'note',
                    // 'department_name',
                    // 'department_code',
                    // 'position_name',
                    // 'position_code',
                ]
                let wrongFields = [];
                if(req.body['first_name'] !== undefined && req.body['first_name'].length > 0 && typeof req.body['first_name'] !== 'string') {
                    wrongFields.push('first_name');
                }
                if(req.body['last_name'] !== undefined && req.body['last_name'].length > 0 && typeof req.body['last_name'] !== 'string') {
                    wrongFields.push('last_name');
                }
                if(req.body['department_id'] !== undefined && req.body['department_id'].length > 0 && objectID.isValid(req.body['department_id']) === false) {
                    wrongFields.push('department_id');
                }
                if(req.body['position_id'] !== undefined && req.body['position_id'].length > 0 && objectID.isValid(req.body['position_id']) === false) {
                    wrongFields.push('position_id');
                }
                if(req.body['education_level_id'] !== undefined && req.body['education_level_id'].length > 0 && objectID.isValid(req.body['education_level_id']) === false) {
                    wrongFields.push('education_level_id');
                }
                if(req.body['type_employee_id'] !== undefined && req.body['type_employee_id'].length > 0 && objectID.isValid(req.body['type_employee_id']) === false) {
                    wrongFields.push('type_employee_id');
                }
                if(req.body['dob'] !== undefined && req.body['dob'].length > 0 && typeof req.body['dob'] !== 'string') {
                    wrongFields.push('dob');
                }
                if(req.body['start_day'] !== undefined && req.body['start_day'].length > 0 && typeof req.body['start_day'] !== 'string') {
                    wrongFields.push('start_day');
                }
                if(req.body['address'] !== undefined && req.body['address'].length > 0 && typeof req.body['address'] !== 'string') {
                    wrongFields.push('address');
                }
                if(req.body['resident_address'] !== undefined && req.body['resident_address'].length > 0 && typeof req.body['resident_address'] !== 'string') {
                    wrongFields.push('resident_address');
                }
                if(req.body['phonenumber'] !== undefined && 
                    (validator.isNumeric(req.body['phonenumber']) === false || validator.isLength(req.body['phonenumber'], {min: 9, max: 11}) === false)) 
                {
                    wrongFields.push('phonenumber');
                }
                if(req.body['email'] !== undefined && req.body['email'].length > 0 && validator.isEmail(req.body['email']) === false) {
                    wrongFields.push('email');
                }
                if(req.body['nationality'] !== undefined && req.body['nationality'].length > 0 && typeof req.body['nationality'] !== 'string') {
                    wrongFields.push('nationality');
                }
                if(req.body['ethnic_group'] !== undefined && req.body['ethnic_group'].length > 0 && typeof req.body['ethnic_group'] !== 'string') {
                    wrongFields.push('ethnic_group');
                }
                if(req.body['note'] !== undefined && req.body['note'].length > 0 && typeof req.body['note'] !== 'string') {
                    wrongFields.push('note');
                }
                if(req.body['identity_number'] !== undefined && req.body['identity_number'].length > 0 && typeof req.body['identity_number'] !== 'string') {
                    wrongFields.push('identity_number');
                }
                if(wrongFields.length > 0) {
                    callback('COMMON.INVALID_DATA', wrongFields);
                    return;
                }
                callback(null);
            },
            /**
             * check exist of department_id
             */
            function(callback) {
                if(req.body['department_id'] === undefined || req.body['department_id'] === null) {
                    return callback(null);
                }
                DEPARTMENT.findOne({_id: req.body['department_id']}, function(err, department) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(department === null) {
                        callback('COMMON.INVALID_DATA', 'department_id');
                        return;
                    }
                    callback(null);
                })
            },
            /**
             * check exist of position_id
             */
            function(callback) {
                if(req.body['position_id'] === undefined || req.body['position_id'] === null) {
                    return callback(null);
                }
                POSITION.findOne({_id: req.body['position_id']}, function(err, position) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(position === null) {
                        callback('COMMON.INVALID_DATA', 'position_id');
                        return;
                    }
                    callback(null);
                })
            },
            /**
             * check exist of type_employee_id
             */
            function(callback) {
                if(req.body['type_employee_id'] === undefined || req.body['type_employee_id'] === null) {
                    return callback(null);
                }
                TYPE_EMPLOYEE.findOne({_id: req.body['type_employee_id']}, function(err, department) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(department === null) {
                        callback('COMMON.INVALID_DATA', 'type_employee_id');
                        return;
                    }
                    callback(null);
                })
            },
            /**
             * check exist of education_level_id
             */
            function(callback) {
                if(req.body['education_level_id'] === undefined || req.body['education_level_id'] === null) {
                    return callback(null);
                }
                EDUCATION_LEVEL.findOne({_id: req.body['education_level_id']}, function(err, department) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(department === null) {
                        callback('COMMON.INVALID_DATA', 'education_level_id');
                        return;
                    }
                    callback(null);
                })
            },
            /**
             * get own profile
             * @param {*} callback 
             */
            function(callback) {
                USER.findOne({_id: user_id}, function(err, user) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(user === null) {
                        callback('ERROR_SERVER', 'anylazist token is wrong');
                        return;
                    }
                    callback(null, user);
                })
            },
            /**
             * progress updating user
             * @param {*} callback 
             */
            function(user, callback) {
                user['first_name'] = req.body['first_name'] ? req.body['first_name'] : user['first_name'];
                user['last_name'] = req.body['last_name'] ? req.body['last_name'] : user['last_name'];
                user['department_id'] = req.body['department_id'] ? req.body['department_id'] : user['department_id'];
                user['position_id'] = req.body['position_id'] ? req.body['position_id'] : user['position_id'];
                user['type_employee_id'] = req.body['type_employee_id'] ? req.body['type_employee_id'] : user['type_employee_id'];
                user['dob'] = req.body['dob'] ? req.body['dob'] : user['dob'];
                user['start_day'] = req.body['start_day'] ? req.body['start_day'] : user['start_day'];
                user['address'] = req.body['address'] ? req.body['address'] : user['address'];
                user['resident_address'] = req.body['resident_address'] ? req.body['resident_address'] : user['resident_address'];
                user['phonenumber'] = req.body['phonenumber'] ? req.body['phonenumber'] : user['phonenumber'];
                user['email'] = req.body['email'] ? req.body['email'] : user['email'];
                user['nationality'] = req.body['nationality'] ? req.body['nationality'] : user['nationality'];
                user['ethnic_group'] = req.body['ethnic_group'] ? req.body['ethnic_group'] : user['ethnic_group'];
                user['note'] = req.body['note'] ? req.body['note'] : user['note'];
                user['working'] = req.body['working'] !== undefined ? req.body['working'] : user['working'];
                // console.log(user['working']+'/'+req.body['working']);
                user['gender'] = req.body['gender'] ? req.body['gender'] : user['gender'];
                user['education_level_id'] = req.body['education_level_id'] ? req.body['education_level_id'] : user['education_level_id'];
                user['identity_number'] = req.body['identity_number'] ? req.body['identity_number'] : user['identity_number'];
                let userUpdated = new USER(user);
                userUpdated.save(function(err) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    callback(null);
                })
            },
            function(callback) {
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
router.delete('/:user_id', function(req, res) {
    let user_id = req.params['user_id'];

    if(objectID.isValid(user_id) === false) {
        httpResponseUtil.generateResponse('COMMON.INVALID_DATA', false, 'user_id', res);
        return;
    }

    USER.deleteOne({_id: user_id}, function(err) {
        if(err) {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
            return;
        }
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res)
    })

})
function queryBaseInformationAggregate(req) {
    let offsetLimitValue_ = generalUtil.retrieveLimitOffsetValue(req);
    let emailQuery_ = generalUtil.buildAggregateQueryWithFieldName('email', req);
    let fullname_ = generalUtil.buildAggregateQueryWithFieldName('fullname', req);
    let username_ = generalUtil.buildAggregateQueryWithFieldName('username', req);
    let department_ = generalUtil.buildAggregateQueryWithFieldNameAndParamName('department_id', 'department_id', req);
    // console.log(emailQuery_);
    // console.log(fullname_);
    // console.log(username_);
    let baseAggre = [
        {
            $match: {
                $or: [
                    emailQuery_, fullname_, username_
                ]      
            }
        },
        {
            $project: {
                first_name: 1,
                last_name: 1,
                username: 1,
                department_id: 1,
                position_id: 1,
                type_employee_id: 1,
                avatar: 1,
                gender: 1,
                dob: 1,
                address: 1,
                resident_address: 1,
                phonenumber: 1,
                email: 1,
                nationality: 1,
                ethnic_group: 1,
                note: 1,
                working: 1,
                identity_number: 1,
                education_level_id: 1,
                start_day: 1,
                fullname: 1
            }
        },
        {
            $lookup: {
                from: 'department',
                localField: 'department_id',
                foreignField: '_id',
                as: 'department'
            }
        },
        {
            $unwind: {
                path: '$department',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                first_name: 1,
                last_name: 1,
                username: 1,
                department_id: 1,
                position_id: 1,
                gender: 1,
                type_employee_id: 1,
                avatar: 1,
                dob: 1,
                address: 1,
                resident_address: 1,
                phonenumber: 1,
                email: 1,
                nationality: 1,
                ethnic_group: 1,
                note: 1,
                identity_number: 1,
                education_level_id: 1,
                start_day: 1,
                department_name: '$department.department_name',
                department_code: '$department.department_code',
                working: 1,
                fullname: 1
            }
        },
        {
            $lookup: {
                from: 'position',
                localField: 'position_id',
                foreignField: '_id',
                as: 'position'
            }
        },
        {
            $unwind: {
                path: '$position',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                first_name: 1,
                last_name: 1,
                username: 1,
                gender: 1,
                department_id: 1,
                position_id: 1,
                type_employee_id: 1,
                avatar: 1,
                dob: 1,
                address: 1,
                resident_address: 1,
                phonenumber: 1,
                email: 1,
                nationality: 1,
                ethnic_group: 1,
                note: 1,
                department_name: 1,
                department_code: 1,
                identity_number: 1,
                education_level_id: 1,
                start_day: 1,
                position_name: '$position.position_name',
                position_code: '$position.position_code',
                working: 1,
                fullname: 1
            }
        },
        {
            $lookup: {
                from: 'type_employee',
                localField: 'type_employee_id',
                foreignField: '_id',
                as: 'type_employee'
            }
        },
        {
            $unwind: {
                path: '$type_employee',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                first_name: 1,
                last_name: 1,
                username: 1,
                gender: 1,
                department_id: 1,
                position_id: 1,
                type_employee_id: 1,
                avatar: 1,
                dob: 1,
                address: 1,
                resident_address: 1,
                phonenumber: 1,
                email: 1,
                nationality: 1,
                ethnic_group: 1,
                note: 1,
                department_name: 1,
                department_code: 1,
                position_name: 1,
                position_code: 1,
                identity_number: 1,
                education_level_id: 1,
                start_day: 1,
                type_employee_name: '$type_employee.type_employee_name',
                type_employee_code: '$type_employee.type_employee_code',
                working: 1,
                fullname: 1
            }
        }
    ]
    let departmentAggre = [
        {
            $match: {
                $or: [department_]
            }
        }
    ]
    if(department_.department_id !== undefined && department_.department_id !== null) {
        baseAggre = baseAggre.concat(departmentAggre);
    }
    // console.log(offsetLimitValue_);
    let limitAggre = [
        {
            $skip: offsetLimitValue_.offset
        },
        {
            $limit: offsetLimitValue_.limit
        }
    ]
    return baseAggre.concat(limitAggre);
}
router.put('/:user_id/password', function(req, res) {
    let user_id = req.params["user_id"];
    async.waterfall([
        //check user_id
        function(callback) {
            if(!user_id) {
                callback('COMMON.MISSING_DATA', 'user_id');
                return;
            }
            if(objectID.isValid(user_id) === false) {
                callback('COMMON.INVALID_DATA', 'user_id');
                return;
            }
            USER.findOne({_id: user_id}, function(error, data) {
                if(error) {
                    callback('ERROR_SERVER');
                    return;
                }
                if(data === null) {
                    callback('COMMON.INVALID_DATA', 'user_id');
                    return;
                }
                callback(null);
            })
        },
        //check role
        function(callback) {
            if(req.role_code === "USER" && req.user_id !== user_id) {
                callback('COMMON.INVALID_DATA', 'user_id');
                return;
            }
            callback(null);
        },
        function(callback) {
            let requiredFields = [
                'oldpass',
                'newpass',
                'repass'
            ];
            let missingFields = [];
            requiredFields.forEach(function(elem) {
                if(req.body[elem] === null || req.body[elem] === undefined || req.body[elem].trim().length === 0) {
                    missingFields.push(elem);
                }
            })
            if(missingFields.length > 0) {
                callback('COMMON.MISSING_DATA', requiredFields);
                return;
            }
            let wrongFields = [];
            if(req.body['oldpass'].trim().length < 6) {
                wrongFields.push('oldpass');
            }
            if(req.body['newpass'].trim().length < 6) {
                wrongFields.push('newpass');
            }
            if(req.body['repass'].trim().length < 6) {
                wrongFields.push('repass');
            }
            if(req.body['repass'].trim() !== req.body['newpass'].trim()) {
                wrongFields.push('repass and newpass');
            }
            if(wrongFields.length > 0) {
                callback('COMMON.INVALID_DATA', wrongFields);
                return;
            }

            callback(null);
        },
        function(callback) {
            USER.findOne({_id: user_id}, {password: 1},function(error, data) {
                if(error) {
                    callback('ERROR_SERVER');
                    return;
                }
                if(data === null) {
                    callback('COMMON.INVALID_DATA', 'user_id');
                    return;
                }
                // Load hash from your password DB.
                bcrypt.compare(req.body['oldpass'], data.password, function(err, result) {
                    // res == true
                    if(result === true) {
                        callback(null);
                    } else {
                        callback('COMMON.INVALID_DATA', 'oldpass');
                        return;
                    }
                });
            })
        },
        function(callback) {
            bcrypt.hash(req.body['newpass'], constants.saltRounds, function(err, hash) {
                // Store hash in your password DB.
                if(err) {
                    callback('ERROR_SERVER');
                    return;
                }
                callback(null, hash);
            });
        },
        function(hash, callback) {
            USER.findOneAndUpdate({_id: user_id}, {$set: {password: hash, tokens: []}}, function(error, data) {
                if(error) {
                    callback('ERROR_SERVER');
                    return;
                }
                callback(null);
            })
        },
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
module.exports = router;