const express = require("express");
const FORM = require("../model/form");
const httpResponseUtil = require("../lib/http_response_Util");
const path = require("path");
const multer = require("multer");
const path_Config = require("../config/path");
const constants = require("../config/constants");
const objectID = require("mongoose").Types.ObjectId;
const async = require("async");
const fs = require("fs");
const generalUtil = require("../lib/general_Util");
const KHTD = require("../model/khtd");
const DEPARTMENT = require("../model/department");
const POSITION = require("../model/position");
const SPECIALITY = require("../model/speciality");
const TYPEEMPLOYEE = require("../model/type_employee");
const EDUCATIONLEVEL = require("../model/education_level");
const KHTDDETAIL = require("../model/khtd_detail");
const USER = require("../model/user");
const validator = require("validator");
// const validator = require('validator');
let router = express.Router();

router.get("/forms", function(req, res) {
  let titleQuery_ = generalUtil.buildAggregateQueryWithFieldName("title", req);
  let typeFileQuery_ = generalUtil.buildAggregateQueryWithFieldName(
    "type_file",
    req
  );
  let noteQuery_ = generalUtil.buildAggregateQueryWithFieldName("note", req);
  let limitOffsetValue_ = generalUtil.retrieveLimitOffsetValue(req);
  FORM.aggregate([
    {
      $project: {
        _id: 1,
        title: 1,
        type_file: 1,
        note: 1,
        created_at: 1
      }
    },
    {
      $match: {
        $or: [titleQuery_, typeFileQuery_, noteQuery_]
      }
    },
    {
      $sort: {
        created_at: -1
      }
    },
    {
      $skip: limitOffsetValue_.offset
    },
    {
      $limit: limitOffsetValue_.limit
    }
  ]).then(function(success) {
    httpResponseUtil.generateResponse(
      "COMMON.SUCCESSFULLY",
      true,
      success,
      res
    );
  });
});
router.get("/forms/:id/:type_file/download", function(req, res) {
  let file_id = req.params["id"];
  let type_file = req.params["type_file"];
  // console.log(file_id + "/" + type_file);
  res.sendFile(
    path.resolve(__dirname + "/../public/files/" + file_id + "." + type_file),
    function(err) {
      console.log(err);
      // if(err) {
      //     httpResponseUtil.generateResponse('ERROR_SERVER', false, null, res);
      //     return;
      // }
      // httpResponseUtil.generateResponse('COMMON.SUCCESSFULLY', true, success, res);
    }
  );
});

let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./public/" + path_Config.files + "/");
  },
  filename: function(req, file, cb) {
    //handle filename to note and name
    let splitedName = file.originalname.split(constants.formatSplitText);
    let title = splitedName[0];
    let splitedNote = splitedName[1].split(".");
    let note = splitedNote[0];
    let type_file = splitedNote[1];

    let formDocument = {
      title: title,
      note: note,
      type_file: type_file
    };
    FORM.create(formDocument, function(err, document) {
      if (err) {
        httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
        return;
      }
      let fileName = String(document._id) + "." + type_file;
      cb(null, fileName);
    });
  }
});
let upload = multer({
  storage: storage
}).single("files");

router.post("/forms", function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
      return;
    }
    // console.log(req.file);
    httpResponseUtil.generateResponse("COMMON.SUCCESSFULLY", true, null, res);
  });
});
router.delete("/forms/:id", function(req, res) {
  let id = req.params["id"];
  async.waterfall(
    [
      function(callback) {
        if (objectID.isValid(id) === false) {
          callback("COMMON.INVALID_DATA", "id");
          return;
        }
        callback(null);
      },
      function(callback) {
        FORM.findOne({ _id: id }, function(err, document) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (document === undefined || document === null) {
            callback("COMMON.INVALID_DATA", "id");
            return;
          }
          callback(null, document.type_file);
        });
      },
      function(type_file, callback) {
        FORM.deleteOne({ _id: id }, function(err) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          callback(null, type_file);
        });
      },
      /**
       *
       */
      function(type_file, callback) {
        httpResponseUtil.generateResponse(
          "COMMON.SUCCESSFULLY",
          true,
          null,
          res
        );
        callback(null, type_file);
      },
      function(type_file, callback) {
        fs.unlink(
          path.join(__dirname + "/../public/files/" + id + "." + type_file),
          function(err) {
            if (err) {
              console.log(err);
            }
          }
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

//recruitment plans
router.get("/recruitment-plans", function(req, res) {
  let limitOffsetValue_ = generalUtil.retrieveLimitOffsetValue(req);
  // console.log(limitOffsetValue_);
  KHTD.aggregate([
    {
      $project: {
        _id: 1,
        khtd_name: 1,
        trimester: 1,
        note: 1,
        created_at: 1
      }
    },
    {
      $sort: {
        created_at: -1
      }
    },
    {
      $skip: limitOffsetValue_.offset
    },
    {
      $limit: limitOffsetValue_.limit
    }
  ]).then(function(success) {
    httpResponseUtil.generateResponse(
      "COMMON.SUCCESSFULLY",
      true,
      success,
      res
    );
  });
});
router.post("/recruitment-plans", function(req, res) {
  async.waterfall(
    [
      function(callback) {
        let fieldsRequired = ["khtd_name", "trimester", "created_at"];
        let missingFields = [];
        fieldsRequired.forEach(function(elem) {
          if (validator.isEmpty(String(req.body[elem])) === true) {
            missingFields.push(elem);
          }
        });
        if (missingFields.length > 0) {
          // httpResponseUtil.generateResponse('COMMON.DATA_INVALID', false, missingFields, res);
          callback("COMMON.INVALID_DATA", missingFields);
          return;
        }
        let FieldsWrong = [];
        if (typeof req.body["trimester"] !== "number") {
          FieldsWrong.push("trimester");
        }
        // if(validator.is(req.body["trimester"]) === false) {
        //   FieldsWrong.push("trimester");
        // }
        if (FieldsWrong.length > 0) {
          callback("COMMON.INVALID_DATA", missingFields);
          return;
        }
        callback(null);
      },
      function(callback) {
        KHTD.create(req.body, function(err, document) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          httpResponseUtil.generateResponse(
            "COMMON.SUCCESSFULLY",
            true,
            document._id,
            res
          );
        });
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
router.post("/recruitment-plans/:recruitment_id", function(req, res) {
  let recruitment_id = req.params["recruitment_id"];
  async.waterfall(
    [
      /**
       * check recruitment-plan_id is exist
       * @param {*} callback
       */
      function(callback) {
        if (
          validator.isEmpty(recruitment_id) === true ||
          objectID.isValid(recruitment_id) === false
        ) {
          callback("COMMON.INVALID_DATA", "recruitment_id");
          return;
        }
        KHTD.findOne({ _id: objectID(recruitment_id) }, function(err, res) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMON.INVALID_DATA", "recruitment_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * Check
       * @param {*} callback
       */
      function(callback) {
        let requiredFields = [
          "department_id",
          "position_id",
          "number",
          "type_employee_id"
        ];
        let missingFields = [];
        requiredFields.forEach(function(elem) {
          if (validator.isEmpty(String(elem)) === true) {
            missingFields.push(elem);
          }
        });
        if (missingFields.length > 0) {
          callback("COMMON.MISSING_DATA", missingFields);
          return;
        }
        let wrongFields = [];
        if (!objectID.isValid(req.body["department_id"])) {
          wrongFields.push("department_id");
        }
        if (!objectID.isValid(req.body["position_id"])) {
          wrongFields.push("position_id");
        }
        if (!objectID.isValid(req.body["type_employee_id"])) {
          wrongFields.push("type_employee_id");
        }
        if (typeof req.body["number"] !== "number") {
          wrongFields.push("number");
        }
        if (
          req.body["number_man"] &&
          typeof req.body["number_man"] !== "number"
        ) {
          wrongFields.push("number_man");
        }
        if (
          req.body["education_level_id"] &&
          !objectID.isValid(req.body["education_level_id"])
        ) {
          wrongFields.push("education_level_id");
        }
        if (
          req.body["speciality_id"] &&
          !objectID.isValid(req.body["speciality_id"])
        ) {
          wrongFields.push("speciality_id");
        }
        if (
          req.body["min_salary"] &&
          typeof req.body["min_salary"] !== "number"
        ) {
          wrongFields.push("min_salary");
        }
        if (
          req.body["max_salary"] &&
          typeof req.body["max_salary"] !== "number"
        ) {
          wrongFields.push("max_salary");
        }
        if (
          req.body["experience_year"] &&
          typeof req.body["experience_year"] !== "number"
        ) {
          wrongFields.push("experience_year");
        }
        if (req.body["age_from"] && typeof req.body["age_from"] !== "number") {
          wrongFields.push("age_from");
        }
        if (req.body["age_to"] && typeof req.body["age_to"] !== "number") {
          wrongFields.push("age_to");
        }
        if (wrongFields.length > 0) {
          callback("COMMON.INVALID_DATA", wrongFields);
          return;
        }
        callback(null);
      },
      /**
       * check department_id is exist in db
       */
      function(callback) {
        DEPARTMENT.findOne({ _id: req.body["department_id"] }, function(
          err,
          res
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "department_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * check position_id is exist in db
       */
      function(callback) {
        POSITION.findOne({ _id: req.body["position_id"] }, function(err, res) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "position_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * check type_employee_id is exist in db
       */
      function(callback) {
        TYPEEMPLOYEE.findOne({ _id: req.body["type_employee_id"] }, function(
          err,
          res
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "type_employee_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * check education_level_id is exist in db
       */
      function(callback) {
        if (!req.body["education_level_id"]) {
          callback(null);
          return;
        }

        EDUCATIONLEVEL.findOne(
          { _id: req.body["education_level_id"] },
          function(err, res) {
            if (err) {
              callback("ERROR_SERVER", null);
              return;
            }
            if (res === null) {
              callback("COMMMON.INVALID_DATA", "education_level_id");
              return;
            }
            callback(null);
          }
        );
      },
      /**
       * check speciality_id is exist in db
       */
      function(callback) {
        if (!req.body["speciality_id"]) {
          callback(null);
          return;
        }

        SPECIALITY.findOne({ _id: req.body["speciality_id"] }, function(
          err,
          res
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "speciality_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * create new document for recruitment_detail collection
       */
      function(callback) {
        req.body["khtd_id"] = recruitment_id;
        req.body["created_at"] = new Date();
        KHTDDETAIL.create(req.body, function(err, res) {
          if (err) {
            console.log(err);
            callback("ERROR_SERVER", null);
            return;
          }
          callback(null);
        });
      },
      /**
       * successfully
       */
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
router.get("/recruitment-plans/:recruitment_id", function(req, res) {
  let recruitment_id = req.params["recruitment_id"];
  async.waterfall(
    [
      function(callback) {
        if (
          validator.isEmpty(recruitment_id) === true ||
          objectID.isValid(recruitment_id) === false
        ) {
          callback("COMMON.INVALID_DATA", "recruitment_id");
          return;
        }
        KHTD.findOne({ _id: objectID(recruitment_id) }, function(err, res) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMON.INVALID_DATA", "recruitment_id");
            return;
          }
          callback(null);
        });
      },
      function(callback) {
        KHTDDETAIL.aggregate([
          {
            $match: {
              khtd_id: objectID(recruitment_id)
            }
          },
          {
            $project: {
              _id: 1,
              khtd_id: 1,
              number: 1,
              department_id: 1,
              position_id: 1,
              min_salary: 1,
              max_salary: 1,
              type_employee_id: 1,
              education_level_id: 1,
              speciality_id: 1,
              language_level: 1,
              licensed: 1,
              created_at: 1
            }
          },
          {
            $lookup: {
              from: "department",
              localField: "department_id",
              foreignField: "_id",
              as: "department"
            }
          },
          {
            $unwind: "$department"
          },
          {
            $project: {
              _id: 1,
              khtd_id: 1,
              number: 1,
              department_id: 1,
              position_id: 1,
              min_salary: 1,
              max_salary: 1,
              type_employee_id: 1,
              education_level_id: 1,
              speciality_id: 1,
              language_level: 1,
              licensed: 1,
              created_at: 1,
              department_name: "$department.department_name",
              department_code: "$department.department_code"
            }
          },
          {
            $lookup: {
              from: "position",
              localField: "position_id",
              foreignField: "_id",
              as: "position"
            }
          },
          {
            $unwind: "$position"
          },
          {
            $project: {
              _id: 1,
              khtd_id: 1,
              number: 1,
              department_id: 1,
              position_id: 1,
              min_salary: 1,
              max_salary: 1,
              type_employee_id: 1,
              education_level_id: 1,
              speciality_id: 1,
              language_level: 1,
              licensed: 1,
              department_name: 1,
              department_code: 1,
              created_at: 1,
              position_name: "$position.position_name",
              position_code: "$position.position_code"
            }
          },
          {
            $lookup: {
              from: "type_employee",
              localField: "type_employee_id",
              foreignField: "_id",
              as: "type_employee"
            }
          },
          {
            $unwind: "$type_employee"
          },
          {
            $project: {
              _id: 1,
              khtd_id: 1,
              number: 1,
              department_id: 1,
              position_id: 1,
              min_salary: 1,
              max_salary: 1,
              type_employee_id: 1,
              education_level_id: 1,
              speciality_id: 1,
              language_level: 1,
              licensed: 1,
              department_name: 1,
              department_code: 1,
              position_name: 1,
              position_code: 1,
              created_at: 1,
              type_employee_name: "$type_employee.type_employee_name",
              type_employee_code: "$type_employee.type_employee_code"
            }
          },
          {
            $lookup: {
              from: "education_level",
              localField: "education_level_id",
              foreignField: "_id",
              as: "education_level"
            }
          },
          {
            $unwind: {
              path: "$education_level",
              preserveNullAndEmptyArrays: true
            }
            // preserveNullAndEmptyArrays: true
          },
          {
            $project: {
              _id: 1,
              khtd_id: 1,
              number: 1,
              department_id: 1,
              position_id: 1,
              min_salary: 1,
              max_salary: 1,
              type_employee_id: 1,
              education_level_id: 1,
              speciality_id: 1,
              language_level: 1,
              licensed: 1,
              department_name: 1,
              department_code: 1,
              type_employee_name: 1,
              type_employee_code: 1,
              position_name: 1,
              position_code: 1,
              created_at: 1,
              education_level_name: "$education_level.education_level_name",
              education_level_code: "$education_level.education_level_code"
            }
          },
          {
            $lookup: {
              from: "speciality",
              localField: "speciality_id",
              foreignField: "_id",
              as: "speciality"
            }
          },
          {
            $unwind: {
              path: "$speciality",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              khtd_id: 1,
              number: 1,
              department_id: 1,
              position_id: 1,
              min_salary: 1,
              max_salary: 1,
              type_employee_id: 1,
              education_level_id: 1,
              speciality_id: 1,
              language_level: 1,
              licensed: 1,
              department_name: 1,
              department_code: 1,
              type_employee_name: 1,
              type_employee_code: 1,
              position_name: 1,
              position_code: 1,
              created_at: 1,
              speciality_name: "$speciality.speciality_name",
              speciality_code: "$speciality.speciality_code"
            }
          },
          {
            $sort: {
              created_at: -1
            }
          }
        ]).then(function(success) {
          httpResponseUtil.generateResponse(
            "COMMON.SUCCESSFULLY",
            true,
            success,
            res
          );
        });
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
router.delete("/recruitment-plans/:recruitment_id", function(req, res) {
  let recruitment_id = req.params["recruitment_id"];
  // console.log(recruitment_id);
  if (
    validator.isEmpty(recruitment_id) === true ||
    objectID.isValid(recruitment_id) === false
  ) {
    httpResponseUtil.generateResponse(
      "COMMON.INVALID_DATA",
      false,
      "recruitment_id",
      res
    );
    return;
  }
  KHTD.findOneAndDelete({ _id: objectID(recruitment_id) }, function(err, khtd) {
    if (err) {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
      return;
    }
    if (khtd === null) {
      httpResponseUtil.generateResponse(
        "COMMON.INVALID_DATA",
        false,
        "recruitment_id",
        res
      );
      return;
    }
    httpResponseUtil.generateResponse("COMMON.SUCCESSFULLY", true, null, res);
  });
});
router.get("/recruitment-detail/:recruitment_detail_id", function(req, res) {
  let recruitment_detail_id = req.params["recruitment_detail_id"];
  if (
    recruitment_detail_id === null ||
    recruitment_detail_id === undefined ||
    recruitment_detail_id.trim().length === 0
  ) {
    httpResponseUtil.generateResponse(
      "COMMON.MISSING_DATA",
      false,
      "recruitment_detail_id",
      res
    );
    return;
  }
  if (objectID.isValid(recruitment_detail_id) === false) {
    httpResponseUtil.generateResponse(
      "COMMON.INVALID_DATA",
      false,
      "recruitment_detail_id",
      res
    );
    return;
  }

  KHTDDETAIL.findOne({ _id: recruitment_detail_id }, function(err, kttdDetail) {
    if (err) {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
      return;
    }
    if (kttdDetail === null) {
      httpResponseUtil.generateResponse(
        "COMMON.INVALID_DATA",
        false,
        "recruitment_detail_id",
        res
      );
      return;
    }
    httpResponseUtil.generateResponse(
      "COMMON.SUCCESSFULLY",
      true,
      kttdDetail,
      res
    );
  });
});
router.delete("/recruitment-detail/:recruitment_detail_id", function(req, res) {
  let recruitment_detail_id = req.params["recruitment_detail_id"];
  if (
    recruitment_detail_id === null ||
    recruitment_detail_id === undefined ||
    recruitment_detail_id.trim().length === 0
  ) {
    httpResponseUtil.generateResponse(
      "COMMON.MISSING_DATA",
      false,
      "recruitment_detail_id",
      res
    );
    return;
  }
  if (objectID.isValid(recruitment_detail_id) === false) {
    httpResponseUtil.generateResponse(
      "COMMON.INVALID_DATA",
      false,
      "recruitment_detail_id",
      res
    );
    return;
  }
  KHTDDETAIL.findOneAndDelete({ _id: recruitment_detail_id }, function(
    err,
    kttdDetail
  ) {
    if (err) {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
      return;
    }
    if (kttdDetail === null) {
      httpResponseUtil.generateResponse(
        "COMMON.INVALID_DATA",
        false,
        "recruitment_detail_id",
        res
      );
      return;
    }
    httpResponseUtil.generateResponse("COMMON.SUCCESSFULLY", true, null, res);
  });
});
router.put("/recruitment-detail/:recruitment_detail_id", function(req, res) {
  let recruitment_detail_id = req.params["recruitment_detail_id"];
  async.waterfall(
    [
      /**
       * check recruitment-plan_id is exist
       * @param {*} callback
       */
      function(callback) {
        if (
          validator.isEmpty(recruitment_detail_id) === true ||
          objectID.isValid(recruitment_detail_id) === false
        ) {
          callback("COMMON.INVALID_DATA", "recruitment_detail_id");
          return;
        }
        KHTDDETAIL.findOne({ _id: objectID(recruitment_detail_id) }, function(
          err,
          khtdDetail
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (khtdDetail === null) {
            callback("COMMON.INVALID_DATA", "recruitment_detail_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * Check
       * @param {*} callback
       */
      function(callback) {
        let requiredFields = [
          "department_id",
          "position_id",
          "number",
          "type_employee_id"
        ];
        let missingFields = [];
        requiredFields.forEach(function(elem) {
          if (validator.isEmpty(String(elem)) === true) {
            missingFields.push(elem);
          }
        });
        if (missingFields.length > 0) {
          callback("COMMON.MISSING_DATA", missingFields);
          return;
        }
        let wrongFields = [];
        if (!objectID.isValid(req.body["department_id"])) {
          wrongFields.push("department_id");
        }
        if (!objectID.isValid(req.body["position_id"])) {
          wrongFields.push("position_id");
        }
        if (!objectID.isValid(req.body["type_employee_id"])) {
          wrongFields.push("type_employee_id");
        }
        if (typeof req.body["number"] !== "number") {
          wrongFields.push("number");
        }
        if (
          req.body["education_level_id"] &&
          !objectID.isValid(req.body["education_level_id"])
        ) {
          wrongFields.push("education_level_id");
        }
        if (
          req.body["speciality_id"] &&
          !objectID.isValid(req.body["speciality_id"])
        ) {
          wrongFields.push("speciality_id");
        }
        if (
          req.body["min_salary"] &&
          typeof req.body["min_salary"] !== "number"
        ) {
          wrongFields.push("min_salary");
        }
        if (
          req.body["max_salary"] &&
          typeof req.body["max_salary"] !== "number"
        ) {
          wrongFields.push("max_salary");
        }
        if (
          req.body["experience_year"] &&
          typeof req.body["experience_year"] !== "number"
        ) {
          wrongFields.push("experience_year");
        }
        if (req.body["age_from"] && typeof req.body["age_from"] !== "number") {
          wrongFields.push("age_from");
        }
        if (req.body["age_to"] && typeof req.body["age_to"] !== "number") {
          wrongFields.push("age_to");
        }
        if (
          req.body["number_man"] &&
          typeof req.body["number_man"] !== "number"
        ) {
          wrongFields.push("number_man");
        }
        if (wrongFields.length > 0) {
          callback("COMMON.INVALID_DATA", wrongFields);
          return;
        }
        callback(null);
      },
      /**
       * check department_id is exist in db
       */
      function(callback) {
        DEPARTMENT.findOne({ _id: req.body["department_id"] }, function(
          err,
          res
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "department_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * check position_id is exist in db
       */
      function(callback) {
        POSITION.findOne({ _id: req.body["position_id"] }, function(err, res) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "position_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * check type_employee_id is exist in db
       */
      function(callback) {
        TYPEEMPLOYEE.findOne({ _id: req.body["type_employee_id"] }, function(
          err,
          res
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "type_employee_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * check education_level_id is exist in db
       */
      function(callback) {
        if (!req.body["education_level_id"]) {
          callback(null);
          return;
        }

        EDUCATIONLEVEL.findOne(
          { _id: req.body["education_level_id"] },
          function(err, res) {
            if (err) {
              callback("ERROR_SERVER", null);
              return;
            }
            if (res === null) {
              callback("COMMMON.INVALID_DATA", "education_level_id");
              return;
            }
            callback(null);
          }
        );
      },
      /**
       * check speciality_id is exist in db
       */
      function(callback) {
        if (!req.body["speciality_id"]) {
          callback(null);
          return;
        }

        SPECIALITY.findOne({ _id: req.body["speciality_id"] }, function(
          err,
          res
        ) {
          if (err) {
            callback("ERROR_SERVER", null);
            return;
          }
          if (res === null) {
            callback("COMMMON.INVALID_DATA", "speciality_id");
            return;
          }
          callback(null);
        });
      },
      /**
       * create new document for recruitment_detail collection
       */
      function(callback) {
        // req.body["khtd_id"] = recruitment_id;
        // req.body["created_at"] = new Date();
        KHTDDETAIL.findOneAndUpdate(
          { _id: recruitment_detail_id },
          { $set: req.body },
          function(err, res) {
            if (err) {
              console.log(err);
              callback("ERROR_SERVER", null);
              return;
            }
            callback(null);
          }
        );
      },
      /**
       * successfully
       */
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
router.get("/recruitment-plans/:recruitment_id/candidates", function(req, res) {
  let recruitment_id = req.params["recruitment_id"];
  // console.log(recruitment_id);
  if (
    validator.isEmpty(recruitment_id) === true ||
    objectID.isValid(recruitment_id) === false
  ) {
    httpResponseUtil.generateResponse(
      "COMMON.INVALID_DATA",
      false,
      "recruitment_id",
      res
    );
    return;
  }

  // let khtdQuery_ = generalUtil.buildAggregateQueryWithFieldNameAndParamName('khtd_id', '')
  USER.aggregate([
    {
      $match: {
        khtd_id: objectID(recruitment_id)
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
        avatar_url: 1,
        dob: 1,
        address: 1,
        resident_address: 1,
        phonenumber: 1,
        email: 1,
        nationality: 1,
        ethnic_group: 1,
        note: 1,
        working: 1,
        fullname: { $concat: ["$last_name", " ", "$first_name"] },
        khtd_id: 1,
        mentor_id: 1
      }
    },
    {
      $lookup: {
        from: "department",
        localField: "department_id",
        foreignField: "_id",
        as: "department"
      }
    },
    {
      $unwind: {
        path: "$department",
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
        avatar_url: 1,
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
        department_name: "$department.department_name",
        department_code: "$department.department_code",
        working: 1,
        khtd_id: 1,
        fullname: 1,
        mentor_id: 1
      }
    },
    {
      $lookup: {
        from: "position",
        localField: "position_id",
        foreignField: "_id",
        as: "position"
      }
    },
    {
      $unwind: {
        path: "$position",
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
        avatar_url: 1,
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
        position_name: "$position.position_name",
        position_code: "$position.position_code",
        working: 1,
        khtd_id: 1,
        fullname: 1,
        mentor_id: 1
      }
    },
    {
      $lookup: {
        from: "type_employee",
        localField: "type_employee_id",
        foreignField: "_id",
        as: "type_employee"
      }
    },
    {
      $unwind: {
        path: "$type_employee",
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
        avatar_url: 1,
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
        type_employee_name: "$type_employee.type_employee_name",
        type_employee_code: "$type_employee.type_employee_code",
        working: 1,
        khtd_id: 1,
        fullname: 1,
        mentor_id: 1
      }
    },
    {
      $match: {
        $or: [
          { type_employee_code: "THUCTAP" },
          { type_employee_code: "THUVIEC" }
        ]
      }
    },
    {
      $match: {
        $or: [
          { mentor_id: null },
          { mentor_id: undefined }
        ]
      }
    }
  ]).then(function(success) {
    // console.log(success);
    httpResponseUtil.generateResponse(
      "COMMON.SUCCESSFULLY",
      true,
      success,
      res
    );
  });
});
router.get("/mentors/:recruitment_plan_id", function(req, res) {
  let recruitment_plan_id = req.params["recruitment_plan_id"];

  if (
    validator.isEmpty(recruitment_plan_id) === true ||
    objectID.isValid(recruitment_plan_id) === false
  ) {
    httpResponseUtil.generateResponse("COMMON.INVALID_DATA", false, "recruitment_plan_id", res)
    return;
  }
  KHTDDETAIL.aggregate([
    {
      $match: {
        khtd_id: objectID(recruitment_plan_id)
      }
    },
    {
      $project: {
        department_id: 1
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "department_id",
        foreignField: "department_id",
        as: "users"
      }
    },
    {
      $unwind: "$users"
    },
    {
      $project: {
        _id: "$users._id",
        first_name: "$users.first_name",
        last_name: "$users.last_name",
        username: "$users.username",
        department_id: "$users.department_id",
        position_id: "$users.position_id",
        type_employee_id: "$users.type_employee_id",
        avatar_url: "$users.avatar_url",
        dob: "$users.dob",
        address: "$users.address",
        resident_address: "$users.resident_address",
        phonenumber: "$users.phonenumber",
        email: "$users.email",
        nationality: "$users.nationality",
        ethnic_group: "$users.ethnic_group",
        note: "$users.note",
        working: "$users.working",
        fullname: { $concat: ["$users.last_name", " ", "$users.first_name"] }
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        department_id: 1,
        position_id: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        from: "department",
        localField: "department_id",
        foreignField: "_id",
        as: "department"
      }
    },
    {
      $unwind: {
        path: "$department",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        department_id: 1,
        position_id: 1,
        gender: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        department_name: "$department.department_name",
        department_code: "$department.department_code",
        working: 1,
        fullname: 1
      }
    },
    {
      $lookup: {
        from: "position",
        localField: "position_id",
        foreignField: "_id",
        as: "position"
      }
    },
    {
      $unwind: {
        path: "$position",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        gender: 1,
        department_id: 1,
        position_id: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        position_name: "$position.position_name",
        position_code: "$position.position_code",
        working: 1,
        fullname: 1
      }
    },
    {
      $lookup: {
        from: "type_employee",
        localField: "type_employee_id",
        foreignField: "_id",
        as: "type_employee"
      }
    },
    {
      $unwind: {
        path: "$type_employee",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        gender: 1,
        department_id: 1,
        position_id: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        type_employee_name: "$type_employee.type_employee_name",
        type_employee_code: "$type_employee.type_employee_code",
        working: 1,
        fullname: 1
      }
    },
    {
      $match: {
        type_employee_code: 'CHINHTHUC'
      }
    }
  ]).then(function(success) {
    httpResponseUtil.generateResponse(
      "COMMON.SUCCESSFULLY",
      true,
      success,
      res
    );
  });
});
router.get("/mentor-candidates/:mentor_id", function(req, res){
  let mentor_id = req.params["mentor_id"];

  if (
    validator.isEmpty(mentor_id) === true ||
    objectID.isValid(mentor_id) === false
  ) {
    httpResponseUtil.generateResponse("COMMON.INVALID_DATA", false, "mentor_id", res)
    return;
  }

  USER.aggregate([
    {
      $match: {
        mentor_id: objectID(mentor_id)
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        department_id: 1,
        position_id: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        fullname: { $concat: ["$last_name", " ", "$first_name"] },
        khtd_id: 1
      }
    },
    {
      $lookup: {
        from: "department",
        localField: "department_id",
        foreignField: "_id",
        as: "department"
      }
    },
    {
      $unwind: {
        path: "$department",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        department_id: 1,
        position_id: 1,
        gender: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        department_name: "$department.department_name",
        department_code: "$department.department_code",
        working: 1,
        fullname: 1,
        khtd_id: 1
      }
    },
    {
      $lookup: {
        from: "position",
        localField: "position_id",
        foreignField: "_id",
        as: "position"
      }
    },
    {
      $unwind: {
        path: "$position",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        gender: 1,
        department_id: 1,
        position_id: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        position_name: "$position.position_name",
        position_code: "$position.position_code",
        working: 1,
        fullname: 1,
        khtd_id: 1
      }
    },
    {
      $lookup: {
        from: "type_employee",
        localField: "type_employee_id",
        foreignField: "_id",
        as: "type_employee"
      }
    },
    {
      $unwind: {
        path: "$type_employee",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        gender: 1,
        department_id: 1,
        position_id: 1,
        type_employee_id: 1,
        avatar_url: 1,
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
        type_employee_name: "$type_employee.type_employee_name",
        type_employee_code: "$type_employee.type_employee_code",
        working: 1,
        fullname: 1,
        khtd_id: 1
      }
    },
    {
      $match: {
        $or: [{type_employee_code: 'THUCTAP'}, {type_employee_code: 'THUVIEC'}]
      }
    }
  ]).then(function(success) {
    httpResponseUtil.generateResponse(
      "COMMON.SUCCESSFULLY",
      true,
      success,
      res
    );
  })
} )
router.put("/mentor-candidates/:mentor_id/:candidate_id/:set_mentor", function(req, res) {
  let mentor_id = req.params["mentor_id"];
  let candidate_id = req.params["candidate_id"];
  let set_mentor = req.params["set_mentor"];
  // console.log('set_mentor: ', set_mentor);
  // console.log(typeof set_mentor);
  // return;
  if (
    validator.isEmpty(mentor_id) === true ||
    objectID.isValid(mentor_id) === false ||
    validator.isEmpty(candidate_id) === true ||
    objectID.isValid(candidate_id) === false
  ) {
    httpResponseUtil.generateResponse("COMMON.INVALID_DATA", false, ["mentor_id", "candidate_id"], res)
    return;
  }

  USER.findOneAndUpdate({_id: objectID(candidate_id)}, {$set: {mentor_id: set_mentor === 'true' ? mentor_id : null}}, function(err, document) {
    if(err) {
      httpResponseUtil.generateResponse("ERROR_SERVER", false, null, res);
      return;
    }
    if(document === null || document === undefined) {
      httpResponseUtil.generateResponse("COMMON.INVALID_DATA", false, "candidate_id", res);
      return;
    }
    httpResponseUtil.generateResponse("COMMON.SUCCESSFULLY", true, null, res);
  })
})
module.exports = router;
