const express = require('express');
const DEPARTMENT = require('../model/department');
const POSITION = require('../model/position');
const TYPEEMPLOYRR = require('../model/type_employee');
const httpResponseUtil = require('../lib/http_response_Util');
const generalUtil = require('../lib/general_Util');
const EDUCATIONLEVEL = require('../model/education_level');
const SPECIALITY = require('../model/speciality');
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
module.exports = router;