const express = require('express');
const DEPARTMENT = require('../model/department');
const POSITION = require('../model/position');
const TYPEEMPLOYRR = require('../model/type_employee');
const httpResponseUtil = require('../lib/http_response_Util');
const generalUtil = require('../lib/general_Util');
const EDUCATIONLEVEL = require('../model/education_level');
const SPECIALITY = require('../model/speciality');
const USER = require('../model/user');
const MESSAGE = require('../model/message');
const MESSAGE_TEXT = require('../model/message_text');
const crawlGmail = require('../lib/email_Util');
const async = require('async');
const constants = require('../config/constants');
const objectID = require('mongoose').Types.ObjectId;
let router = express.Router();

router.get('/departments', function(req, res) {
    DEPARTMENT.aggregate([
        {
            $project: {
                _id: 1,
                department_name: 1,
                department_code: 1
            }
        }
    ]).then(function(success) {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
})
router.get('/typesemployee', function(req, res) {
    TYPEEMPLOYRR.aggregate([
        {
            $project: {
                _id: 1,
                type_employee_name: 1,
                type_employee_code: 1
            }
        }
    ]).then(function(success) {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
})
router.get('/positions', function(req, res) {
    let deparment_ = generalUtil.buildAggregateQueryWithFieldName('_id', req);
    DEPARTMENT.aggregate([
        {
            $project: {
                _id: 1,
                department_name: 1,
                department_code: 1
            }
        },
        {
            $match: deparment_
        },
        {
            $lookup: {
                from: 'position',
                localField: '_id',
                foreignField: 'department_id',
                as: 'position'
            }
        },
        {
            $unwind: '$position'
        },  
        {
            $project: {
                _id: '$position._id',
                position_name: '$position.position_name',
                position_code: '$position.position_code',
            }
        },
    ]).then(function(success) {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
    // POSITION.aggregate([
    //     {
    //         $project: {
    //             position_name: 1,
    //             position_code: 1
    //         }
    //     }
    // ]).then(function(success) {
    //     httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    // })
})
router.get('/educationlevel', function(req, res) {
    EDUCATIONLEVEL.aggregate([
        {
            $project: {
                _id: 1,
                education_level_name: 1,
                education_level_code: 1
            }
        }
    ]).then(success=> {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
})
router.get('/speciality', function(req, res) {
    SPECIALITY.aggregate([
        {
            $project: {
                _id: 1,
                speciality_name: 1,
                speciality_code: 1
            }
        }
    ]).then(success=> {
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    })
})
router.get('/crawlgmail', function(req, res) {
    async.waterfall([
        function(callback) {
            crawlGmail(function(error, result) {
                if(error) {
                    callback('ERROR_SERVER');
                    return;
                }
                callback(null, result);
            });
        },
        function(data, callback) {
            let formatedData = data.filter(function(elem) {
                if(elem.title.includes(constants.format_title_crawl_gmail)) {
                    return true;
                }
            })
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, formatedData, res);
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
    
})
//message
router.get('/message', function(req, res) {
    buildAggregateForGetMessage(req, req.user_id, function(error, data) {
        if(error) {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
            return;
        }
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, data, res);
    })
})
router.get('/message/:message_id', function(req, res) {
    let message_id = req.params["message_id"];
    async.waterfall([
        //check id is valid ??
        function(callback) {
            if(message_id === undefined || message_id === null || message_id.trim().length === 0) {
                callback('COMMON.INVALID_PARAMETER', null);
                return;
            }
            if(objectID.isValid(message_id) === false) {
                callback('COMMON.INVALID_PARAMETER', null);
                return;
            }
            MESSAGE.findOne({_id: message_id, list_user_id: objectID(req.user_id)}, function(err, message_data) {
                if(err) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                if(message_data === null) {
                    callback('COMMON.INVALID_PARAMETER', null);
                    return;
                }
                callback(null, message_data);
            })
        },
        //get message_text
        function(message_data, callback) {
            buildAggregateForGetMessageText(message_id, req, function(error, message_text_data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                //update status "seen" from message text
                callback(null, message_data, message_text_data);
                //emit to client another

                //response successfully
                httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, message_text_data, res);
            })
        },
        //update status "seen" from message text
        function(message_data, message_text_data, callback) {
            //
            let i = message_text_data.length - 1;
            for(i; i >= 0; i--) {
                if(String(message_text_data[i].user_id) == req.user_id) {
                    break;
                }
            }
            //if final text is mine
            let countingMessages = (message_text_data.length - 1) - (i);
            for(i = i + 1; i <= message_text_data.length - 1; i++) {
                message_text_data[i]['status_viewed']['status'] = true;
                if(message_text_data[i]['status_viewed'] && message_text_data[i]['status_viewed']['who_id'] && typeof message_text_data[i]['status_viewed']['who_id'] === 'array') {
                    message_text_data[i]['status_viewed']['who_id'].push(req.user_id);
                }
                message_text_data[i]['status_viewed']['date'] = new Date();
                MESSAGE_TEXT.findOneAndUpdate({_id: message_text_data[i]._id}, {$set: message_text_data[i]}, function(err, data) {
                    countingMessages--;
                    if(countingMessages === 0) {
                        emitDataToClientWithID(message_data.list_user_id, {message_id: message_data._id}, req);
                        // emitNotificationOrChatToClient([req.user_id], true, req);
                    }
                })
            }
            //
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.post('/message', function(req, res) {
    async.waterfall([
        function(callback) {
            let requiredFields = [
                'user_id_2',
                'content'
            ]
            let missingFields = [];
            requiredFields.forEach(function(elem) {
                if(req.body[elem] === undefined || req.body[elem] === null || req.body[elem].trim().length === 0) {
                    missingFields.push(elem);
                }
            })
            if(missingFields.length > 0) {
                callback('COMMON.MISSING_DATA', missingFields);
                return;
            }
            let wrongFields = [];
            if(objectID.isValid(req.body['user_id_2']) === false) {
                wrongFields.push('user_id_2');
            }
            if(wrongFields.length > 0) {
                callback('COMMON.INVALID_DATA', wrongFields);
                return;
            }
            //CHECKING USER_ID_2 IS EXIST
            USER.findOne({_id: req.body["user_id_2"]}, function(error, user_data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                if(user_data === null) {
                    callback('COMMON.INVALID_DATA', 'user_id_2');
                    return;
                }
                callback(null);
            })
        },
        //look for user_id and user_id_2 has exist in same message document with type: INDIVIDUAL
        function(callback) {
            MESSAGE.aggregate([
                {
                    $match: {
                        $and: [
                            {type_message: constants.message_individual.type_message_code},
                            {list_user_id: objectID(req.body["user_id_2"])}, 
                            {list_user_id: objectID(req.user_id)}
                        ]
                    }
                }
            ], function(error, message_data) {
                // console.log('$match:' + error + '/' + message_data);
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                //if unavailable
                if(message_data.length === 0) {
                    callback(null, false, null);
                    return;
                }
                //if available, send id
                callback(null, true, message_data[0]._id);
            })
        },
        function(isAvailable, message_id, callback) {
            if(isAvailable === true) {
                let new_Message_Text = {
                    message_id: message_id,
                    content: req.body["content"],
                    created_at: new Date(),
                    user_id: req.user_id
                }
                MESSAGE_TEXT.create(new_Message_Text, function(error) {
                    if(error) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    callback(null, message_id);
                })
            } else {
                let new_Message = {
                    list_user_id: [
                        req.user_id,
                        req.body["user_id_2"]
                    ],
                    type_message: constants.message_individual.type_message_code,
                    created_at: new Date()
                }
                MESSAGE.create(new_Message, function(error, message_data) {
                    if(error) {
                        callback('ERROR_SERVER', null);
                        return;
                    }
                    //after create message-> create messate_text
                    let new_Message_Text = {
                        message_id: message_data._id,
                        content: req.body["content"],
                        created_at: new Date(),
                        user_id: req.user_id
                    }
                    MESSAGE_TEXT.create(new_Message_Text, function(error, message) {
                        if(error) {
                            callback('ERROR_SERVER', null);
                            return;
                        }
                        callback(null, message_data._id);
                    })
                })
            }
        },
        function(message_id, callback) {
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, message_id, res);
            emitDataToClientWithID([req.body["user_id_2"], req.user_id], {message_id: message_id}, req);
            emitNotificationOrChatToClient([req.body["user_id_2"]], true, req);
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.get('/message/search/:user_id_2', function(req, res) {
    async.waterfall([
        function(callback) {
            if(req.params["user_id_2"] === undefined || req.params["user_id_2"] === null || req.params["user_id_2"].trim().length === 0) {
                callback('COMMON.MISSING_DATA', 'user_id_2');
                return;
            }

            let wrongFields = [];
            if(objectID.isValid(req.params['user_id_2']) === false) {
                wrongFields.push('user_id_2');
            }
            if(wrongFields.length > 0) {
                callback('COMMON.INVALID_DATA', wrongFields);
                return;
            }
            //CHECKING USER_ID_2 IS EXIST
            USER.findOne({_id: req.params["user_id_2"]}, function(error, user_data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                if(user_data === null) {
                    callback('COMMON.INVALID_DATA', 'user_id_2');
                    return;
                }
                callback(null);
            })
        },
        //look for user_id and user_id_2 has exist in same message document with type: INDIVIDUAL
        function(callback) {
            MESSAGE.aggregate([
                {
                    $match: {
                        $and: [
                            {type_message: constants.message_individual.type_message_code},
                            {list_user_id: objectID(req.params["user_id_2"])}, 
                            {list_user_id: objectID(req.user_id)}
                        ]
                    }
                }
            ], function(error, message_data) {
                // console.log('$match:' + error + '/' + message_data);
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                //if unavailable
                if(message_data.length === 0) {
                    callback(null, null);
                    return;
                }
                //if available, send id
                callback(null, message_data[0]._id);
            })
        },
        function(message_id, callback) {
            if(message_id === null) {
                httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
                return;
            }
            //if have
            MESSAGE.aggregate([
                {
                    $match: {
                        _id: objectID(message_id)
                    }
                },
                {
                    $unwind: '$list_user_id'
                },
                {
                    $project: {
                        _id: 1,
                        list_user_id: 1,
                        type_message: 1,
                        created_date: 1,
                        list_user_id: '$list_user_id'
                    }
                },
                {
                    $match: {
                        // $not: [{list_user_id: objectID(req.user_id)}]    
                        list_user_id: {$ne: objectID(req.user_id)}     
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'list_user_id',
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
                        list_user_id: 1,
                        type_message: 1,
                        created_date: 1,
                        list_user_id: 1,
                        first_name: '$users.first_name',
                        last_name: '$users.last_name',
                        avatar: '$users.avatar',
                    }
                },
                {
                    $project: {
                        _id: 1,
                        list_user_id: 1,
                        type_message: 1,
                        created_date: 1,
                        list_user_id: 1,
                        first_name: 1,
                        last_name: 1,
                        avatar: 1,
                        fullname: {
                            $concat: ['$last_name', ' ', '$first_name']
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        list_user_id: {
                            $push: "$list_user_id"
                        },
                        type_message: {
                            $first: '$type_message'
                        },
                        created_date: {
                            $first: '$created_date'
                        },
                        first_name: {
                            $first: '$first_name'
                        },
                        last_name: {
                            $first: '$last_name'
                        },
                        avatar: {
                            $first: '$avatar'
                        },
                        fullname: {
                            $first: '$fullname'
                        },
                    }
                }
                //limit offset
            ], function(error, data) {
                if(error) {
                    httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
                    return;
                }
                httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, data[0], res);
            })
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
function emitDataToClientWithID(arrIDUser = [], data = {}, req) {
    arrIDUser.forEach(function(elem) {
        USER.findOne({_id: elem}, function(error, user_data) {
            if(error) {
                console.log(error);
                return;
            }
            if(user_data !== null && (user_data.socket_chat_id !== null || user_data.socket_chat_id !== undefined) && user_data.length !== 0) {
                user_data.socket_chat_id.forEach(function(elem_socket_id) {
                    buildAggregateForGetMessageText(data.message_id, req, function(error, message_text_data) {
                        if(error) {
                            return;
                        }
                        req.io.to(elem_socket_id).emit('LISTMESSAGETEXT', {message_id: data.message_id, data: message_text_data});
                    })
                    buildAggregateForGetMessage(req, elem, function(error, message_data) {
                        if(error) {
                            return;
                        }
                        req.io.to(elem_socket_id).emit('LISTUSERCHATED', {data: message_data});
                    })
                })
            }
        })
    })
}
function emitNotificationOrChatToClient(arrIDUser = [], isChat = true, req) {
    arrIDUser.forEach(function(elem) {
        if(elem === req.user_id) {
            return;
        }
        USER.findOne({_id: elem}, function(error, user_data) {
            if(error) {
                console.log(error);
                return;
            }
            if(user_data !== null && (user_data.socket_chat_id !== null || user_data.socket_chat_id !== undefined) && user_data.length !== 0) {
                user_data.socket_chat_id.forEach(function(elem_socket_id) {
                    // buildAggregateForGetMessageText(data.message_id, req, function(error, message_text_data) {
                    //     if(error) {
                    //         return;
                    //     }
                    //     req.io.to(elem_socket_id).emit('LISTMESSAGETEXT', {message_id: data.message_id, data: message_text_data});
                    // })
                    // buildAggregateForGetMessage(req, elem, function(error, message_data) {
                    //     if(error) {
                    //         return;
                    //     }
                    //     req.io.to(elem_socket_id).emit('LISTUSERCHATED', {data: message_data});
                    // })
                    buildAggregateForGetNumberMessageUnread(elem, req, function(error, data) {
                        if(error) {
                            return;
                        }
                        if(isChat === true) {
                            req.io.to(elem_socket_id).emit('HAVEMESSAGE', {data: data.length});
                        }
                    })
                    
                })
            }
        })
    })
    
}
function buildAggregateForGetMessageText(message_id, req, callback) {
    let offsetLimitQuery_ = generalUtil.retrieveLimitOffsetValue(req);
    MESSAGE_TEXT.aggregate([
        {
            $match: {
                message_id: objectID(message_id)
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
                content: 1,
                created_at: 1,
                message_id: 1,
                status_viewed: 1,
                first_name: '$users.first_name',
                last_name: '$users.last_name',
                avatar: '$users.avatar',
            }
        },
        {
            $project: {
                _id: 1,
                user_id: 1,
                content: 1,
                created_at: 1,
                message_id: 1,
                status_viewed: 1,
                first_name: 1,
                last_name: 1,
                avatar: 1,
                fullname: {
                    $concat: ['$last_name', ' ', '$first_name']
                }
            }
        },
        {
            $sort: {
                created_at: -1
            }
        },
        {
            $skip: offsetLimitQuery_.offset
        },
        {
            $limit: offsetLimitQuery_.limit
        },
        {
            $sort: {
                created_at: 1
            }
        },
        //limit offset
    ], function(error, message_text_data) {
        if(error) {
            callback('ERROR_SERVER', null);
            return;
        }
        //update status "seen" from message text
        callback(null, message_text_data);
        //emit to client another

        //response successfully
        // httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, message_text_data, res);
    })
}
function buildAggregateForGetMessage(req, user_id, callback) {
    MESSAGE.aggregate([
        {
            $match: {
                list_user_id: objectID(user_id)
            }
        },
        {
            $unwind: '$list_user_id'
        },
        {
            $project: {
                _id: 1,
                list_user_id: 1,
                type_message: 1,
                created_date: 1,
                list_user_id: '$list_user_id'
            }
        },
        {
            $match: {
                // $not: [{list_user_id: objectID(req.user_id)}]    
                list_user_id: {$ne: objectID(user_id)}     
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'list_user_id',
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
                list_user_id: 1,
                type_message: 1,
                created_date: 1,
                list_user_id: 1,
                first_name: '$users.first_name',
                last_name: '$users.last_name',
                avatar: '$users.avatar',
                active_message: '$users.active_message',
                fullname: {
                    $concat: ["$last_name" , " ", "$first_name"]
                }
            }
        },
        {
            $project: {
                _id: 1,
                list_user_id: 1,
                type_message: 1,
                created_date: 1,
                list_user_id: 1,
                first_name: 1,
                last_name: 1,
                avatar: 1,
                active_message: 1,
                fullname: {
                    $concat: ["$last_name" , " ", "$first_name"]
                }
            }
        },
        {
            $group: {
                _id: '$_id',
                list_user_id: {
                    $push: "$list_user_id"
                },
                type_message: {
                    $first: '$type_message'
                },
                created_date: {
                    $first: '$created_date'
                },
                first_name: {
                    $push: '$first_name'
                },
                last_name: {
                    $push: '$last_name'
                },
                fullname: {
                    $push: '$fullname'
                },
                avatar: {
                    $first: '$avatar'
                },
                active_message: {
                    $first: '$active_message'
                }
            }
        },
        {
            $lookup: {
                from: 'message_text',
                localField: '_id',
                foreignField: 'message_id',
                as: 'message_text'
            }
        },
        {
            $unwind: {
                path: '$message_text',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                list_user_id: 1,
                type_message: 1,
                first_name: 1,
                last_name: 1,
                avatar: 1,
                active_message: 1,
                content_text: '$message_text.content',
                status_viewed_text: '$message_text.status_viewed',
                created_at_text: '$message_text.created_at',
                user_id_text: '$message_text.user_id',
                fullname: 1
            }
        },
        {
            $sort: {
                created_at_text: 1
            }
        },
        {
            $group: {
                _id: '$_id',
                list_user_id: {
                    $first: '$list_user_id'
                },
                type_message: {
                    $first: '$type_message'
                },
                content_text: {
                    $last: '$content_text'
                },
                status_viewed_text: {
                    $last: '$status_viewed_text'
                },
                created_at_text: {
                    $last: '$created_at_text'
                },
                user_id_text: {
                    $last: '$user_id_text'
                },
                first_name: {
                    $first: '$first_name'
                },
                last_name: {
                    $first: '$last_name'
                },
                avatar: {
                    $first: '$avatar'
                },
                fullname: {
                    $first: '$fullname'
                },
                active_message: {
                    $first: '$active_message'
                }
            }
        },
        {
            $sort: {
                created_at_text: -1
            }
        }
        //limit offset
    ], function(error, data) {
        callback(error, data);
    })
}
function buildAggregateForGetNumberMessageUnread(user_id, req, callback) {
    MESSAGE.aggregate([
        {
            $match: {
                list_user_id: objectID(user_id)
            }
        },
        {
            $unwind: '$list_user_id'
        },
        {
            $project: {
                _id: 1,
                list_user_id: 1,
                type_message: 1,
                created_date: 1,
                list_user_id: '$list_user_id'
            }
        },
        {
            $match: {
                // $not: [{list_user_id: objectID(req.user_id)}]    
                list_user_id: {$ne: objectID(user_id)}     
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'list_user_id',
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
                list_user_id: 1,
                type_message: 1,
                created_date: 1,
                list_user_id: 1,
                first_name: '$users.first_name',
                last_name: '$users.last_name',
                avatar: '$users.avatar',
                active_message: '$users.active_message',
                fullname: {
                    $concat: ["$last_name" , " ", "$first_name"]
                }
            }
        },
        {
            $project: {
                _id: 1,
                list_user_id: 1,
                type_message: 1,
                created_date: 1,
                list_user_id: 1,
                first_name: 1,
                last_name: 1,
                avatar: 1,
                active_message: 1,
                fullname: {
                    $concat: ["$last_name" , " ", "$first_name"]
                }
            }
        },
        {
            $group: {
                _id: '$_id',
                list_user_id: {
                    $push: "$list_user_id"
                },
                type_message: {
                    $first: '$type_message'
                },
                created_date: {
                    $first: '$created_date'
                },
                first_name: {
                    $push: '$first_name'
                },
                last_name: {
                    $push: '$last_name'
                },
                fullname: {
                    $push: '$fullname'
                },
                avatar: {
                    $first: '$avatar'
                },
                active_message: {
                    $first: '$active_message'
                }
            }
        },
        {
            $lookup: {
                from: 'message_text',
                localField: '_id',
                foreignField: 'message_id',
                as: 'message_text'
            }
        },
        {
            $unwind: {
                path: '$message_text',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                list_user_id: 1,
                type_message: 1,
                first_name: 1,
                last_name: 1,
                avatar: 1,
                active_message: 1,
                content_text: '$message_text.content',
                status_viewed_text: '$message_text.status_viewed',
                created_at_text: '$message_text.created_at',
                user_id_text: '$message_text.user_id',
                fullname: 1
            }
        },
        {
            $sort: {
                created_at_text: 1
            }
        },
        {
            $group: {
                _id: '$_id',
                list_user_id: {
                    $first: '$list_user_id'
                },
                type_message: {
                    $first: '$type_message'
                },
                content_text: {
                    $last: '$content_text'
                },
                status_viewed_text: {
                    $last: '$status_viewed_text'
                },
                created_at_text: {
                    $last: '$created_at_text'
                },
                user_id_text: {
                    $last: '$user_id_text'
                },
                first_name: {
                    $first: '$first_name'
                },
                last_name: {
                    $first: '$last_name'
                },
                avatar: {
                    $first: '$avatar'
                },
                fullname: {
                    $first: '$fullname'
                },
                active_message: {
                    $first: '$active_message'
                },
                
            }
        },
        // {
        //     $sort: {
        //         created_at_text: -1
        //     }
        // },
        {
            $match: {
                // $not: [{list_user_id: objectID(req.user_id)}]    
                $and: [{user_id_text: {$ne: objectID(user_id)}}, {'status_viewed_text.status': false}]
            }
        },
        //limit offset
    ], function(error, data) {
        callback(error, data);
    })
}
router.post('/message/group', function(req, res) {
    async.waterfall([
        function(callback) {
            let requiredFields = [
                'list_user_id'
            ]
            let missingFields = [];
            requiredFields.forEach(function(elem) {
                if(req.body[elem] === null || req.body[elem] === undefined || req.body[elem].length === 0) {
                    missingFields.push(elem);
                }
            })
            if(missingFields.length > 0) {
                callback('COMMON.MISSING_DATA', missingFields);
                return;
            }
            let wrongFields = [];
            if(Array.isArray(req.body['list_user_id']) === false || req.body['list_user_id'].length < 2) {
                wrongFields.push('list_user_id');
            }
            if(Array.isArray(req.body['list_user_id']) === true) {
                let countingWrongValue = 0;
                req.body['list_user_id'].forEach(function(elem) {
                    if(objectID.isValid(elem) === false) {
                        countingWrongValue++;
                    }
                })
                if(countingWrongValue > 0) {
                    wrongFields.push('list_user_id');
                }
            }
            if(wrongFields.length > 0) {
                callback('COMMON.INVALID_DATA', wrongFields);
                return;
            }
            callback(null);
        },
        //check existing of list_user_id
        function(callback) {
            let covertedFields = req.body['list_user_id'].map(function(elem) {
                return objectID(elem);
            })
            USER.find({_id: {$in: covertedFields}}, function(error, user_data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                if(user_data.length !== req.body['list_user_id'].length) {
                    callback('COMMON.INVALID_DATA', 'list_user_id');
                    return;
                }
                callback(null);
            })
        },
        function(callback) {
            //add my id into list_user_id
            req.body['list_user_id'].push(req.user_id);
            //format
            let formatingInputData = {
                list_user_id: req.body['list_user_id'],
                type_message: constants.message_group.type_message_code,
                date: new Date()
            }
            MESSAGE.create(formatingInputData, function(error, message_data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                //call success
                httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
                emitDataToClientWithID(req.body['list_user_id'], {message_id: message_data._id}, req);
            })
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.post('/message/group/:message_id', function(req, res) {
    let message_id = req.params['message_id'];
    async.waterfall([
        //validator fields input
        function(callback) {
            let requiredFields = [
                'content'
            ]
            let missingFields = [];
            requiredFields.forEach(function(elem) {
                if(req.body[elem] === null || req.body[elem] === undefined || req.body[elem].trim().length === 0) {
                    missingFields.push(elem);
                }
            })
            if(message_id === undefined || message_id === null || message_id.trim().length === 0) {
                missingFields.push('message_id');
            }
            if(missingFields.length > 0) {
                callback('COMMON.MISSING_DATA', missingFields);
                return;
            }
            let wrongFields = [];
            if(objectID.isValid(message_id) === false) {
                wrongFields.push('message_id');
            }
            if(wrongFields.length > 0) {
                callback('COMMON.INVALID_DATA', missingFields);
                return;
            }
            callback(null);
        },
        //check existing of message_id
        function(callback) {
            MESSAGE.findOne({_id: message_id, type_message: constants.message_group.type_message_code}, function(error, message_data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                if(message_data === null) {
                    callback('COMMON.INVALID_DATA', 'message_id');
                    return;
                }
                callback(null, message_data);
            })
        },
        //CREATE new message_text document
        function(message_data, callback) {
            let formatData = {
                message_id: message_id,
                content: req.body['content'],
                user_id: req.user_id,
                created_at: new Date()
            }
            MESSAGE_TEXT.create(formatData, function(error) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
                emitDataToClientWithID(message_data['list_user_id'], {message_id: message_data['_id']}, req);
                emitNotificationOrChatToClient(message_data['list_user_id'], true, req);
            })
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
router.get('/messageheader', function(req, res) {
    // console.log('this');
    buildAggregateForGetNumberMessageUnread(req.user_id, req, function(error, data) {
        if(error) {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
            return;
        }
        
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, data.length, res);
    })
})
module.exports = router;