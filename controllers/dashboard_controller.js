const express = require('express');
const USER = require("../model/user");
const MESSAGETEXT = require('../model/message_text');
const MESSAGE = require('../model/message');
const DAYOFF = require("../model/day_off");
const DAYOT = require("../model/day_ot");
const SALARY = require('../model/salary');
const WARRANTY = require('../model/warranty');
const ADVANCE_PAYMENT = require('../model/advance_payment');
const SLIDESHOW = require('../model/slideshow');
const objectID = require('mongoose').Types.ObjectId;
const async = require('async');
const httpResponseUtil = require('../lib/http_response_Util');
const generalUtil = require('../lib/general_Util');
const constants = require('../config/constants');
const multer = require('multer');
const paths = require('../config/path');
const fs = require('fs');
const path = require('path');
let router = express.Router();

router.get('/messages', function(req, res) {
    async.waterfall([
        //get all number of message
        function(callback) {
            coutingMessages(req.user_id, null, null, function(err, data) {
                if(err) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                callback(null, data);
            })
        },
        //get number of message this month
        function(allMessage, callback) {
            let current_date = new Date();
            let start_date = new Date(current_date.getFullYear() + "-" + (current_date.getMonth() + 1) + '-' + '1');
            let end_date = new Date(current_date.getFullYear() + "-" + (current_date.getMonth() + 2) + '-' + '1');
            coutingMessages(req.user_id, start_date, end_date, function(err, data) {
                if(err) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                callback(null, allMessage, data);
            })
        },
        //get number of message this week
        function(allMessage, monthMessage, callback) {
            let start_date = new Date();
            if(start_date.getDay() !== 0) {
                start_date.setDate(start_date.getDate() - (start_date.getDay() - 1));
            } else {
                start_date.setDate(start_date.getDate() - 6);
            }
            let end_date = new Date();
            end_date.setDate(end_date.getDate() + 1);

            coutingMessages(req.user_id, start_date, end_date, function(err, data) {
                if(err) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                callback(null,allMessage, monthMessage, data);
            })
        },
        function(allMessage, monthMessage, weekMessage, callback) {
            let message = {
                allMessage: allMessage.length, 
                monthMessage: monthMessage.length, 
                weekMessage: weekMessage.length
            }
            callback(null, message);
        },
        function(messageCouting, callback) {
            let numberLimit = 5;
            buildAggregateForGetMessage(numberLimit, req.user_id, function(error, data) {
                if(error) {
                    callback('ERROR_SERVER', null);
                    return;
                }
                messageCouting.messages = data;
                callback(null, messageCouting);
            })
        },
        //successfully
        function(messageCouting, callback) {
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, messageCouting, res);
        }
    ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
    })
})
function coutingMessages(user_id, start_date, end_date, callback) {
    let arrAggregate = [];
    if(start_date !== null || end_date !== null) {
        let startDate_ = new Date(start_date);
        let endDate_ = new Date(end_date);
        let arrQueryArangeDate = [
            {
                $match: {
                    'created_at': {$gte: startDate_, $lt: endDate_}
                }
            }
        ]
        arrAggregate = arrAggregate.concat(arrQueryArangeDate);
    }
    let arrAggregateUser = [
        {
            $match: {
                'user_id': objectID(user_id)
            }
        }
    ]
    arrAggregate = arrAggregate.concat(arrAggregateUser);

    MESSAGETEXT.aggregate(arrAggregate, function(err, data) {
        if(err) {
            callback(err, null);
            return;
        }
        callback(null, data);
    })
}
function buildAggregateForGetMessage(limit, user_id, callback) {
    // let limitOffsetQuery_ = generalUtil.retrieveLimitOffsetValue(req);
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
        },
        {
            $limit: limit
        }
        //limit offset
    ], function(error, data) {
        callback(error, data);
    })
}
router.get("/salary", function(req, res) {
    // console.log(req.query["limit"] + '/' + req.query["offset"] + (req.query["limit"] === undefined && req.query["offset"] === undefined));
    // let dateOfInMonthQuery = generalUtil.buildAggregateQueryWithFieldNameAndParamName('')
    // let month = req.query["month"];
    // let year = req.query["year"];
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();

    let monthQuery_ = new Date(year + "-" + month + "-" + "1");
    let nextMonthQuery_ = (Number(month) + 1 <= 12) ? new Date(year + "-" + (Number(month) + 1) + "-" + "1") : new Date((year + 1) + "-" + 1 + "-" + "1");
    async.waterfall(
      [
        function(callback) {
          DAYOFF.aggregate(
            [
              {
                $match: {
                  $and: [
                    { date: { $gte: monthQuery_, $lt: nextMonthQuery_ } },
                    { license: true },
                    { user_id: objectID(req.user_id) }
                  ]
                }
              },
              {
                $group: {
                  _id: "$user_id",
                  total_hour_off: {
                    $sum: "$hours"
                  }
                }
              }
            ],
            function(error, off_data) {
              if (error) {
                callback("ERROR_SERVER", null);
                return;
              }
              callback(null, off_data);
            }
          );
        },
        function(off_data, callback) {
          DAYOT.aggregate(
            [
              {
                $match: {
                  $and: [
                    { date: { $gte: monthQuery_, $lt: nextMonthQuery_ } },
                    { license: true },
                    { user_id: objectID(req.user_id) }
                  ]
                }
              },
              {
                $group: {
                  _id: "$user_id",
                  total_hour_ot_practicial: {
                    $sum: "$hours"
                  },
                  total_hour_ot_calculation_percent: {
                    $sum: {
                      $multiply: ["$hours", "$coefficient"]
                    }
                  }
                }
              }
            ],
            function(error, ot_data) {
              if (error) {
                callback("ERROR_SERVER", null);
                return;
              }
              callback(null, off_data, ot_data);
            }
          );
        },
        function(off_data, ot_data, callback) {
          USER.aggregate([
            {
                $match: {
                    _id: objectID(req.user_id)
                }
            }, 
            {
              $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                email: 1,
                fullname: {
                  $concat: ["$last_name", " ", "$first_name"]
                },
                avatar: 1,
                dob: 1,
                working: 1
              }
            }
          ], function(error, user) {
              if (error) {
                callback("ERROR_SERVER", null);
                return;
              }
              callback(null, off_data, ot_data, user);
            }
          );
        },
        function(off_data, ot_data, user, callback) {
          SALARY.aggregate([
            {
              $match: {
                $and: [
                    {date: {$lt: nextMonthQuery_}}, 
                    {user_id: objectID(req.user_id)}
                ]
              }
            },
            {
              $sort: {
                date: 1
              }
            },
            {
              $group: {
                _id: '$user_id',
                salary: {
                  $last: '$salary'
                }
              }
            }
          ], function(error, salary_data) {
            if (error) {
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null, off_data, ot_data, user, salary_data);
          })
        },
        //Query warranty
        function(off_data, ot_data, user, salary_data, callback) {
          WARRANTY.aggregate([
            {
              $match: {
                $and: [
                    {date: {$lt: nextMonthQuery_}},
                    {user_id: objectID(req.user_id)}
                ]
              }
            },
            {
              $sort: {
                date: 1
              }
            },
            {
              $group: {
                _id: '$user_id',
                warranty_money: {
                  $last: '$warranty_money'
                }
              }
            }
          ], function(error, warranty_data) {
            if (error) {
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null, off_data, ot_data, user, salary_data, warranty_data);
          })
        },
        //Query advance payment
        function(off_data, ot_data, user, salary_data, warranty_data, callback) {
          ADVANCE_PAYMENT.aggregate([
            {
              $match: {
                $and: [
                    {date: {$gte: monthQuery_, $lt: nextMonthQuery_}},
                    {user_id: objectID(req.user_id)}
                ]
              }
            },
          ], function(error, advance_payment_data) {
            if (error) {
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null, off_data, ot_data, user, salary_data, warranty_data, advance_payment_data);
          })
        },
        /**
         * handle output Data
         * @param {*} callback
         */
        function(off_data, ot_data, user, salary_data, warranty_data, advance_payment_data, callback) {
          user.forEach(function(elem_user) {
            //advance_payment
            let isFindingAdvancePayment = false;
            advance_payment_data.forEach(function(elem_payment) {
              if (String(elem_user._id) == String(elem_payment.user_id)) {
                elem_user.advance_payment = elem_payment.advance_payment_money;
                isFindingAdvancePayment = true;
                return;
              }
            })
            if (isFindingAdvancePayment === false) {
              elem_user.advance_payment = 0;
            }
            //warranty
            let isFindingWarranty = false;
            warranty_data.forEach(function(elem_warranty) {
              if (String(elem_user._id) == String(elem_warranty._id)) {
                elem_user.warranty = elem_warranty.warranty_money;
                isFindingWarranty = true;
                return;
              }
            })
            if (isFindingWarranty === false) {
              elem_user.warranty = 0;
            }
            //salary
            let isFindingSalary = false;
            salary_data.forEach(function(elem_salary) {
              if (String(elem_user._id) == String(elem_salary._id)) {
                elem_user.salary = elem_salary.salary;
                isFindingSalary = true;
                return;
              }
            })
            if (isFindingSalary === false) {
              elem_user.salary = 0;
            }
            //off
            let isFindingOFF = false;
            off_data.forEach(function(elem_off) {
              if (String(elem_user._id) == String(elem_off._id)) {
                elem_user.total_hour_off = elem_off.total_hour_off;
                isFindingOFF = true;
                return;
              }
            });
            if (isFindingOFF === false) {
              elem_user.total_hour_off = 0;
            }
            //ot
            let isFindingOT = false;
            ot_data.forEach(function(elem_ot) {
              if (String(elem_user._id) == String(elem_ot._id)) {
                elem_user.total_hour_ot_practicial =
                  elem_ot.total_hour_ot_practicial;
                elem_user.total_hour_ot_calculation_percent =
                  elem_ot.total_hour_ot_calculation_percent;
                isFindingOT = true;
                return;
              }
            });
            if (isFindingOT === false) {
              elem_user.total_hour_ot_practicial = 0;
              elem_user.total_hour_ot_calculation_percent = 0;
            }
            //calculation workday in month
            let numberDateInMonth = new Date(year, month, 0).getDate();
            let weekendNumber = 0;
            for(let i = 1; i <= numberDateInMonth; i++) {
              let day = new Date(year + '-' + month + '-' + i).getDay();
              //if day = sunday
              if(day == 0) {
                weekendNumber++;
              }
            }
            let workdayInMonth = numberDateInMonth - weekendNumber;
            //workhour and workday
            if(Number(month) !== (new Date().getMonth() + 1) && year !== (new Date().getFullYear())) {
              elem_user.workhour = (workdayInMonth * constants.workhourinday) +  elem_user.total_hour_ot_calculation_percent - elem_user.total_hour_off;
              elem_user.workday = elem_user.workhour/constants.workhourinday;
            } else {
              //
              let weekendNumber_current = 0;
              //count number of sunday
              for(let i = 1; i <= new Date().getDate(); i++) {
                let day = new Date(year + '-' + month + '-' + i).getDay();
                //if day = sunday
                if(day == 0) {
                  weekendNumber_current++;
                }
              }
              elem_user.workhour = ((new Date().getDate() - weekendNumber_current)* constants.workhourinday) +  elem_user.total_hour_ot_calculation_percent - elem_user.total_hour_off;
              elem_user.workday = elem_user.workhour/constants.workhourinday;
            }
  
            elem_user.workhourandworkday = elem_user.workhour + '/' + elem_user.workday;
            //calculation money of month
            if(elem_user.salary !== undefined) {
              elem_user.salary_month = parseInt(
                ((elem_user.salary/(workdayInMonth * constants.workhourinday)) * elem_user.workhour) - elem_user.advance_payment - elem_user.warranty
              );
            }
            
          });
  
          httpResponseUtil.generateResponse(
            "COMMON.SUCCESSFULLY",
            true,
            user,
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
    // return;
});
//images of slideshow
let storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './public/slideshow');
  },
  filename: function(req, file, cb) {
      // let user_id = req.params['user_id'];
      let typeFile = file.originalname.split('.');
      if(typeFile[typeFile.length - 1] !== 'jpg' && typeFile[typeFile.length - 1] !== 'png') {
          cb('COMMON.INVALID_DATA');
          return;
      }
      let fileName = paths.slideshow + '_' + file.originalname;
      cb(null, fileName);
  }
})
let upload = multer({
  storage: storage,
  // fileFilter: function(req, file, cb) {

  // }
}).single('img');
router.post('/slideshow', function(req, res) {
  async.waterfall([
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
        let uriImageSlideShow = '/' + paths.slideshow + '/' + fileName;
        
        SLIDESHOW.create({uri: uriImageSlideShow, created_at: new Date()}, function(err) {
            if(err) {
                callback('ERROR_SERVER');
                return;
            }
            httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
        })
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
router.delete('/slideshow/:slide_id', function(req, res) {
  let slide_id = req.params['slide_id'];
  async.waterfall([
    function(callback) {
      if(!slide_id) {
        callback('COMMON.MISSING_DATA', 'slide_id');
        return;
      }
      if(objectID.isValid(slide_id) === false) {
        callback('COMMON.INVALID_DATA', 'slide_id');
        return;
      }
      callback(null);
    },
    function(callback) {
      SLIDESHOW.findOneAndDelete({_id: slide_id}, function(error, data) {
        if(error) {
          callback('ERROR_SERVER', null);
          return;
        }
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);

        callback(null, data);
      })
    },
    function(data, callback) {
      if(!data.uri) {
        return;
      }
      let filename = data.uri.split('/')[data.uri.split('/').length - 1];
      fs.unlink(
        path.join(__dirname + "/../public/slideshow/" + filename),
        function(err) {
          if (err) {
            console.log(err);
          }
        }
      );
    }
  ], function(err, data) {
        if(typeof err === 'string') {
            httpResponseUtil.generateResponse(err, false, data, res);
        } else {
            httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
        }
  })
})
router.get('/slideshow', function(req, res) {
  async.waterfall([
    function(callback) {
      SLIDESHOW.find({}).limit(5).exec(function(error, data) {
        if(error) {
          callback('ERROR_SERVER', null);
          return;
        }
        httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, data, res);
        // callback(null);
      });
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