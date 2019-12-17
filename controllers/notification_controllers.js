const express = require('express');
const async = require('async');
const DAYOT = require('../model/day_ot');
const DAYOFF = require('../model/day_off');
const USER = require('../model/user');
const objectID = require('mongoose').Types.ObjectId;
const constants = require('../config/constants');
const httpResponseUtil = require('../lib/http_response_Util');
const generalUtil = require('../lib/general_Util');
let router = express.Router();

router.get('/', function(req, res) {
    let limitOffsetQuery_ = generalUtil.retrieveLimitOffsetValue(req);
    async.waterfall([
        function(callback) {
            //role is user
            if(req.role_code === constants.role_code.user) {
                DAYOFF.aggregate([
                    {
                        $match: {
                            user_id: objectID(req.user_id)
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'users'
                        }
                    },
                    {
                        $unwind: '$users'
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            note: 1,
                            ismorning_session: 1,
                            hours: 1,
                            created_date: 1,
                            license: 1,
                            first_name: '$users.first_name',
                            last_name: '$users.last_name',
                            dob: '$users.dob',
                            email: '$users.email',
                            avatar: '$users.avatar'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            note: 1,
                            ismorning_session: 1,
                            hours: 1,
                            created_date: 1,
                            license: 1,
                            first_name: 1,
                            last_name: 1,
                            fullname: {
                                $concat: ['$last_name', ' ', '$first_name']
                            },
                            dob: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ], function(error, dayoff_data) {
                    if(error) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    callback(null, dayoff_data);
                })   
            }
            //role is admin
            if(req.role_code === constants.role_code.admin) {
                DAYOFF.aggregate([
                    {
                        $match: {
                            license: {$exists: false}
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'users'
                        }
                    },
                    {
                        $unwind: '$users'
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            note: 1,
                            ismorning_session: 1,
                            hours: 1,
                            created_date: 1,
                            license: 1,
                            first_name: '$users.first_name',
                            last_name: '$users.last_name',
                            dob: '$users.dob',
                            email: '$users.email',
                            avatar: '$users.avatar'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            note: 1,
                            ismorning_session: 1,
                            hours: 1,
                            created_date: 1,
                            license: 1,
                            first_name: 1,
                            last_name: 1,
                            fullname: {
                                $concat: ['$last_name', ' ', '$first_name']
                            },
                            dob: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ], function(error, dayoff_data) {
                    if(error) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    callback(null, dayoff_data);
                })   
            }
               
        },
        function(dayoff_data, callback) {
            //role is user
            if(req.role_code === constants.role_code.user) {
                DAYOT.aggregate([
                    {
                        $match: {
                            user_id: objectID(req.user_id)
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'users'
                        }
                    },
                    {
                        $unwind: '$users'
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            hours: 1,
                            note: 1,
                            coefficient: 1,
                            license: 1,
                            created_date: 1,
                            first_name: '$users.first_name',
                            last_name: '$users.last_name',
                            dob: '$users.dob',
                            email: '$users.email',
                            avatar: '$users.avatar'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            hours: 1,
                            note: 1,
                            coefficient: 1,
                            license: 1,
                            created_date: 1,
                            first_name: 1,
                            last_name: 1,
                            fullname: {
                                $concat: ['$last_name', ' ', '$first_name']
                            },
                            dob: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ], function(error, dayot_data) {
                    if(error) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    callback(null, dayoff_data, dayot_data);
                })   
            }
            //role is admin
            if(req.role_code === constants.role_code.admin) {
                DAYOT.aggregate([
                    {
                        $match: {
                            license: {$exists: false}
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'users'
                        }
                    },
                    {
                        $unwind: '$users'
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            hours: 1,
                            note: 1,
                            coefficient: 1,
                            license: 1,
                            created_date: 1,
                            first_name: '$users.first_name',
                            last_name: '$users.last_name',
                            dob: '$users.dob',
                            email: '$users.email',
                            avatar: '$users.avatar'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            date: 1,
                            hours: 1,
                            note: 1,
                            coefficient: 1,
                            license: 1,
                            created_date: 1,
                            first_name: 1,
                            last_name: 1,
                            fullname: {
                                $concat: ['$last_name', ' ', '$first_name']
                            },
                            dob: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ], function(error, dayot_data) {
                    if(error) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    callback(null, dayoff_data, dayot_data);
                })   
            }
               
        },
        function(dayoff_data, dayot_data, callback) {
            let newDayOff = dayoff_data.map(function(elem) {
                let data = {
                    _id: elem._id,
                    title: 'Day off',
                    fullname: elem.fullname,
                    type: constants.notification_type.off,
                    created_date: elem.created_date ? elem.created_date : new Date('1977-1-1'),
                    date: elem.date,
                    content: 'Đã xin nghỉ',
                    ismorning_session: elem.ismorning_session,
                    hours: elem.hours,
                    note: elem.note,
                    dob: elem.dob,
                    email: elem.email,
                    license: elem.license,
                    avatar: elem.avatar
                }
                return data;
            })
            let newDayOt = dayot_data.map(function(elem) {
                let data = {
                    _id: elem._id,
                    title: 'Day ot',
                    fullname: elem.fullname,
                    type: constants.notification_type.ot,
                    created_date: elem.created_date ? elem.created_date : new Date('1977-1-1'),
                    date: elem.date,
                    content: 'Đã xin làm thêm',
                    hours: elem.hours,
                    dob: elem.dob,
                    email: elem.email,
                    license: elem.license,
                    avatar: elem.avatar
                }
                return data;
            })
            let arrayReturn = newDayOff.concat(newDayOt);
            arrayReturn.sort(function(a, b) {
                return -(new Date(a.created_date) - new Date(b.created_date));
            })
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, arrayReturn.slice(limitOffsetQuery_.offset, limitOffsetQuery_.offset + limitOffsetQuery_.limit), res);
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.put('/access', function(req, res) {
    async.waterfall([
        //check role
        function(callback) {
            if(req.role_code !== 'ADMIN') {
                callback('COMMON.MISSING_DATA', 'role_code');
                return;
            }
            callback(null);
        },
        //check fields
        function(callback) {
            let requiredField = [
                'type_id',
                'type',
                'isaccept'
            ]
            let missingFields = [];
            requiredField.forEach(function(elem) {
                if(req.body[elem] === undefined || req.body[elem] === null) {
                    missingFields.push(elem);
                }
            })
            if(missingFields.length > 0) {
                callback('COMMON.INVALID_DATA', missingFields);
                return;
            }
            let wrongFields = [];
            if(objectID.isValid(req.body['type_id']) === false) {
                wrongFields.push('type_id');
            }
            if(req.body['type'] !== constants.notification_type.off && req.body['type'] !== constants.notification_type.ot) {
                wrongFields.push('type');
            }
            if(typeof req.body['isaccept'] !== 'boolean') {
                wrongFields.push('isaccept');
            }
            if(wrongFields.length > 0) {
                callback('COMMON.INVALID_DATA', wrongFields);
                return;
            }

            callback(null);
        },
        //update
        function(callback) {
            if(req.body['type'] === constants.notification_type.ot) {
                DAYOT.findOneAndUpdate({_id: req.body['type_id']}, {$set: {license: req.body['isaccept'], created_date: new Date()}}, function(err, dayot_data) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(dayot_data === null) {
                        callback('COMMON.INVALID_DATA', 'type_id');
                        return;
                    }

                    callback(null, dayot_data.user_id);
                })
            }
            if(req.body['type'] === constants.notification_type.off) {
                DAYOFF.findOneAndUpdate({_id: req.body['type_id']}, {$set: {license: req.body['isaccept'], created_date: new Date()}}, function(err, dayoff_data) {
                    if(err) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    if(dayoff_data === null) {
                        callback('COMMON.INVALID_DATA', 'type_id');
                        return;
                    }

                    callback(null, dayoff_data.user_id);
                })
            }
        },
        function(user_id, callback) {
            emitNotificationDataToUser(false, user_id, req);
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
function emitNotificationDataToUser(toAdmin, user_id, req) {
    console.log(toAdmin + '/' + user_id);
    if(toAdmin === false) {
      USER.findOne({_id: user_id}, function(error, user_data) {
        if(error || !user_data || !user_data['socket_notification_id'] || Array.isArray(user_data['socket_notification_id']) === false) {
          return;
        }
        
        user_data['socket_notification_id'].forEach(function(elem_socket_id) {
          req.io.to(elem_socket_id).emit('RELOADNOTI', {status: true});
          console.log('socket_noti_id:'+ elem_socket_id);
        })
      })
    }
    if(toAdmin === true) {
      USER.find({role_code: 'ADMIN'}, function(error, user_data) {
        if(error || !user_data || Array.isArray(user_data) === false) {
          return;
        }
        user_data.forEach(function(elem_user) {
          if(!elem_user['socket_notification_id']) {
            return;
          }
          elem_user['socket_notification_id'].forEach(function(elem_socket_id) {
            req.io.to(elem_socket_id).emit('RELOADNOTI', {status: true});
          })
        })
      })
    }
  }
module.exports = router;