const express = require("express");
const USER = require("../model/user");
const DAYOFF = require("../model/day_off");
const DAYOT = require("../model/day_ot");
const SALARY = require('../model/salary');
const WARRANTY = require('../model/warranty');
const ADVANCE_PAYMENT = require('../model/advance_payment');
const generalUtil = require("../lib/general_Util");
const validator = require("validator");
const async = require("async");
const httpResponseUtil = require("../lib/http_response_Util");
const objectID = require("mongoose").Types.ObjectId;
const constants = require('../config/constants');
let router = express.Router();

router.get("/", function(req, res) {
  // console.log(req.query["limit"] + '/' + req.query["offset"] + (req.query["limit"] === undefined && req.query["offset"] === undefined));
  let excelOption = (req.query["limit"] === undefined && req.query["offset"] === undefined) ? true : false;
  let offsetLimitQuery_ = generalUtil.retrieveLimitOffsetValue(req);
  let emailQuery_ = generalUtil.buildAggregateQueryWithFieldName("email", req);
  let fullnameQuery_ = generalUtil.buildAggregateQueryWithFieldName(
    "fullname",
    req
  );
  // let dateOfInMonthQuery = generalUtil.buildAggregateQueryWithFieldNameAndParamName('')
  let month = req.query["month"];
  let year = req.query["year"];
  if (
    month === undefined ||
    month === null ||
    year === undefined ||
    year === null
  ) {
    httpResponseUtil.generateResponse(
      "COMMON.INVALID_DATA",
      false,
      ["month", "year"],
      res
    );
    return;
  }
  let monthQuery_ = new Date(year + "-" + month);
  let nextMonthQuery_ = (Number(month) + 1 <= 12) ? new Date(year + "-" + (Number(month) + 1)) : new Date((year + 1) + "-" + 1);
  async.waterfall(
    [
      function(callback) {
        DAYOFF.aggregate(
          [
            {
              $match: {
                $and: [
                  { date: { $gte: monthQuery_, $lt: nextMonthQuery_ } },
                  { license: true }
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
                  { license: true }
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
        let arrForAggregate = [
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
          },
          {
            $match: {
              $or: [emailQuery_, fullnameQuery_]
            }
          }
        ]
        if(excelOption === false) {
          arrForAggregate = arrForAggregate.concat(
            [
              {
                $skip: offsetLimitQuery_.offset
              },
              {
                $limit: offsetLimitQuery_.limit
              }
            ]
          )
        }
        USER.aggregate(arrForAggregate, function(error, user) {
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
              date: {$lt: nextMonthQuery_}
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
              date: {$lt: nextMonthQuery_}
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
              date: {$gte: monthQuery_, $lt: nextMonthQuery_}
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
router.post("/salary/:user_id", function(req, res) {
  let user_id = req.params["user_id"];
  async.waterfall(
    [
      function(callback) {
        if (
          user_id === undefined ||
          user_id === null ||
          objectID.isValid(user_id) === false
        ) {
          callback("COMMON.INVALID_PARAMETER", "user_id");
          return;
        }
        if (
          req.body["salary"] === undefined ||
          req.body["salary"] === undefined ||
          isNaN(req.body["salary"]) === true
        ) {
          callback("COMMON.INVALID_DATA", "salary");
          return;
        }
        if (
          req.body["date"] === undefined ||
          req.body["date"] === undefined 
        ) {
          callback("COMMON.INVALID_DATA", "date");
          return;
        }
        callback(null);
      },
      function(callback) {
        req.body["user_id"] = user_id;
        SALARY.create(req.body, function(
          err
          // salary
        ) {
          if (err) {
            callback("COMMON.ERROR_SERVER", null);
            return;
          }
          callback(null);
        });
      },
      function(callback) {
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
});
router.post("/warranty/:user_id", function(req, res) {
  let user_id = req.params["user_id"];
  async.waterfall(
    [
      function(callback) {
        if (
          user_id === undefined ||
          user_id === null ||
          objectID.isValid(user_id) === false
        ) {
          callback("COMMON.INVALID_PARAMETER", "user_id");
          return;
        }
        if (
          req.body["warranty_money"] === undefined ||
          req.body["warranty_money"] === undefined ||
          isNaN(req.body["warranty_money"]) === true
        ) {
          callback("COMMON.INVALID_DATA", "warranty_money");
          return;
        }
        if (
          req.body["date"] === undefined ||
          req.body["date"] === undefined 
        ) {
          callback("COMMON.INVALID_DATA", "date");
          return;
        }
        callback(null);
      },
      function(callback) {
        req.body["user_id"] = user_id;
        WARRANTY.create(req.body, function(
          err
          // salary
        ) {
          if (err) {
            callback("COMMON.ERROR_SERVER", null);
            return;
          }
          callback(null);
        });
      },
      function(callback) {
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
});
router.put("/advancepayment/:user_id", function(req, res) {
  let user_id = req.params["user_id"];
  async.waterfall(
    [
      function(callback) {
        if (
          user_id === undefined ||
          user_id === null ||
          objectID.isValid(user_id) === false
        ) {
          callback("COMMON.INVALID_PARAMETER", "user_id");
          return;
        }
        if (
          req.body["advance_payment_money"] === undefined ||
          req.body["advance_payment_money"] === undefined ||
          isNaN(req.body["advance_payment_money"]) === true
        ) {
          callback("COMMON.INVALID_DATA", "advance_payment_money");
          return;
        }
        if (
          req.body["date"] === undefined ||
          req.body["date"] === undefined 
        ) {
          callback("COMMON.INVALID_DATA", "date");
          return;
        }
        callback(null);
      },
      function(callback) {
        let monthQuery_ = new Date(req.body["date"]);
        let nextMonthQuery_ = monthQuery_.getMonth() + 2 <= 12 ? new Date(monthQuery_.getFullYear() + "-" + (monthQuery_.getMonth() + 2)) : 
                              new Date((monthQuery_.getFullYear() + 1) + "-" + 1);
        ADVANCE_PAYMENT.findOneAndUpdate(
          {user_id: user_id, date: {$gte: monthQuery_, $lt: nextMonthQuery_}}, 
          {advance_payment_money: req.body["advance_payment_money"]}, function(
          err,
          advance_payment
        ) {
          if (err) {
            callback("COMMON.ERROR_SERVER", null);
            return;
          }
          if(advance_payment === null) {
            //create new document
            req.body["user_id"] = user_id;
            ADVANCE_PAYMENT.create(req.body, function(err) {
              if (err) {
                callback("COMMON.ERROR_SERVER", null);
                return;
              }
              callback(null);
            })
            return;
          }
          callback(null);
        });
      },
      function(callback) {
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
});
router.get('/timekeeping', function(req, res) {
  let offsetLimitQuery_ = generalUtil.retrieveLimitOffsetValue(req);
  let emailQuery_ = generalUtil.buildAggregateQueryWithFieldName("email", req);
  let fullnameQuery_ = generalUtil.buildAggregateQueryWithFieldName(
    "fullname",
    req
  );
  // let dateOfInMonthQuery = generalUtil.buildAggregateQueryWithFieldNameAndParamName('')
  let month = req.query["month"];
  let year = req.query["year"];
  if (
    month === undefined ||
    month === null ||
    year === undefined ||
    year === null
  ) {
    httpResponseUtil.generateResponse(
      "COMMON.INVALID_DATA",
      false,
      ["month", "year"],
      res
    );
    return;
  }
  let monthQuery_ = new Date(year + "-" + month);
  let nextMonthQuery_ = new Date(year + "-" + (Number(month) + 1));
  async.waterfall(
    [
      function(callback) {
        DAYOT.aggregate(
          [
            {
              $match: {
                $and: [
                  { date: { $gte: monthQuery_, $lt: nextMonthQuery_ } },
                  { license: true }
                ]
              }
            },
          ],
          function(error, ot_data) {
            if (error) {
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null, ot_data);
          }
        );
      },
      function(ot_data, callback) {
        DAYOFF.aggregate(
          [
            {
              $match: {
                $and: [
                  { date: { $gte: monthQuery_, $lt: nextMonthQuery_ } },
                  { license: true }
                ]
              }
            },
          ],
          function(error, off_data) {
            if (error) {
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null, ot_data, off_data);
          }
        );
      },
      function(ot_data, off_data, callback) {
        USER.aggregate(
          [
            {
              $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                email: 1,
                fullname: {
                  $concat: ["$last_name", " ", "$first_name"]
                },
                salary: 1,
                avatar: 1,
                dob: 1
              }
            },
            {
              $match: {
                $or: [emailQuery_, fullnameQuery_]
              }
            },
            {
              $skip: offsetLimitQuery_.offset
            },
            {
              $limit: offsetLimitQuery_.limit
            }
          ],
          function(error, user) {
            if (error) {
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null, ot_data, off_data, user);
          }
        );
      },
      /**
       * handle output Data
       * @param {*} callback
       */
      function(ot_data, off_data, user, callback) {
        user.forEach(function(elem_user) {
          let listDayOFF = [];
          off_data.forEach(function(elem_off) {
            if (String(elem_user._id) == String(elem_off.user_id)) {
              listDayOFF.push(elem_off);
            }
          });
          elem_user.listDayOFF = listDayOFF;
          //OT
          let listDayOT = [];
          ot_data.forEach(function(elem_ot) {
            if (String(elem_user._id) == String(elem_ot.user_id)) {
              listDayOT.push(elem_ot);
            }
          });
          elem_user.listDayOT = listDayOT;
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
})
router.put('/timekeeping/:user_id', function(req, res) {
  let user_id = req.params["user_id"];
  async.waterfall([
    //check user_id
    function(callback) {
      if(user_id === undefined || user_id === null || objectID.isValid(user_id) === false) {
        callback('COMMON.INVALID_DATA', 'user_id');
        return;
      }
      USER.findOne({_id: user_id}, function(err, user) {
        if(err) {
          callback('ERROR_SERVER', null);
          return;
        }
        if(user === null) {
          callback('COMMON.INVALID_DATA', 'user_id');
          return;
        }
        callback(null);
      })
    },
    //check data input
    function(callback) {
      let requiredFields = [
        // 'note',
        'date',
        'ismorning_session',
        'ischecked'
      ]
      let missingField = [];
      requiredFields.forEach(function(field) {
        if(req.body[field] === null || req.body[field] === undefined) {
          missingField.push(field);
        }
      })
      if(missingField.length > 0) {
        callback('COMMON.MISSING_DATA', missingField);
        return;
      }
      let wrongFields = [];
      // console.log(typeof  req.body["date"]);
      // if(typeof  req.body["date"] === 'date')
      if(typeof req.body["ismorning_session"] === 'Boolean') {
        wrongFields.push("ismorning_session");
      }
      if(typeof req.body["ischecked"] === 'Boolean') {
        wrongFields.push("ischecked");
      }
      if(wrongFields.length > 0) {
        callback('COMMON.INVALID_DATA', wrongFields);
        return;
      }
      callback(null);
    },
    function(callback) {
      DAYOFF.findOne({user_id: user_id, date: req.body["date"], ismorning_session: req.body["ismorning_session"]}, function(err, off_data) {
        if(err) {
          callback('ERROR_SERVER', null);
          return;
        }
        //check document is exist => next func to creating new document
        if(off_data === null) {
          callback(null, 'CREATE');
          return;
        }
        //nothing
        if(req.body['ischecked'] === true) {
          callback('COMMON.INVALID_DATA', null);
        } else {
          callback(null, 'DELETE');
        }
        
      })
    },
    function(status, callback) {
      if(status === 'CREATE') {
        //create field for day_off
        req.body.user_id = user_id;
        //can check for admin
        req.body.license = true;
        
        if(req.body["ismorning_session"]) {
          req.body.hours = constants.hours_offmorning;
        } else {
          req.body.hours = constants.hours_offafternoon;
        }

        DAYOFF.create(req.body, function(err) {
          if(err) {
            callback('ERROR_SERVER', null);
            return;
          }
          callback(null);
        })
      } else {
        DAYOFF.findOneAndDelete({user_id: user_id, date: req.body["date"], ismorning_session: req.body["ismorning_session"]}, function(err) {
          if(err) {
            callback('ERROR_SERVER', null);
            return;
          }
          callback(null);
        })
      }
    },
    function(callback) {
      httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
    }
  ], function(err, data) {
    if (typeof err === "string") {
      httpResponseUtil.generateResponse(err, false, data, res);
    } else {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
    }
  })
})
router.put('/timekeeping/ot/:user_id', function(req, res) {
  let user_id = req.params["user_id"];
  async.waterfall([
    //check user_id
    function(callback) {
      if(user_id === undefined || user_id === null || objectID.isValid(user_id) === false) {
        callback('COMMON.INVALID_DATA', 'user_id');
        return;
      }
      USER.findOne({_id: user_id}, function(err, user) {
        if(err) {
          callback('ERROR_SERVER', null);
          return;
        }
        if(user === null) {
          callback('COMMON.INVALID_DATA', 'user_id');
          return;
        }
        callback(null);
      })
    },
    //check data input
    function(callback) {
      let requiredFields = [
        // 'note',
        'date',
        'hours',
        'ischecked'
      ]
      let missingField = [];
      requiredFields.forEach(function(field) {
        if(req.body[field] === null || req.body[field] === undefined) {
          missingField.push(field);
        }
      })
      if(missingField.length > 0) {
        callback('COMMON.MISSING_DATA', missingField);
        return;
      }
      let wrongFields = [];
      // console.log(typeof  req.body["date"]);
      // if(typeof  req.body["date"] === 'date')
      if(typeof req.body["hours"] === 'Number') {
        wrongFields.push("ismorning_session");
      }
      if(typeof req.body["ischecked"] === 'Boolean') {
        wrongFields.push("ischecked");
      }
      if(wrongFields.length > 0) {
        callback('COMMON.INVALID_DATA', wrongFields);
        return;
      }
      callback(null);
    },
    function(callback) {
      DAYOT.findOne({user_id: user_id, date: req.body["date"]}, function(err, ot_data) {
        if(err) {
          callback('ERROR_SERVER', null);
          return;
        }
        //check document is exist => next func to creating new document
        if(ot_data === null) {
          callback(null, 'CREATE');
          return;
        }
        //nothing
        if(req.body['ischecked'] === true) {
          callback('COMMON.INVALID_DATA', null);
        } else {
          callback(null, 'DELETE');
        }
        
      })
    },
    function(status, callback) {
      if(status === 'CREATE') {
        //create field for day_off
        req.body.user_id = user_id;
        //can check for admin
        req.body.license = true;
        
        //handle effecient of ot
        if(req.body["isholiday"] === true) {
          req.body.coefficient = constants.coefficientHoliday;
        } else {
          //get weekend
          let date = new Date(req.body["date"]);
          if(date.getDay() === 0 || date.getDay() === 6) {
            req.body.coefficient = constants.coefficientWeekend;
          } else {
            req.body.coefficient = constants.coefficientNormal;
          }
        }

        //
        DAYOT.create(req.body, function(err) {
          if(err) {
            callback('ERROR_SERVER', null);
            return;
          }
          callback(null);
        })
      } else {
        DAYOT.findOneAndDelete({user_id: user_id, date: req.body["date"]}, function(err) {
          if(err) {
            callback('ERROR_SERVER', null);
            return;
          }
          callback(null);
        })
      }
    },
    function(callback) {
      httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, null, res);
    }
  ], function(err, data) {
    if (typeof err === "string") {
      httpResponseUtil.generateResponse(err, false, data, res);
    } else {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
    }
  })
})
module.exports = router;
