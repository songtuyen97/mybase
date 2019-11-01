const constants = require("../config/constants");
const objectID = require("mongoose").Types.ObjectId;
let generalUtil = {
  retrieveLimitOffsetValue: function(req) {
    let limit = req.query["limit"];
    let offset = req.query["offset"];

    if (limit === undefined || limit === null || isNaN(limit) === true) {
      limit = constants.limit_DEFAULT;
    }
    if (offset === undefined || offset === null || isNaN(offset) === true) {
      offset = constants.offset_DEFAULT;
    }

    return {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  },
  /**
   * Escape special character in string
   * @param  {string}   str string to escape special character
   */
  escapeRegExp: function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },
  buildAggregateQueryWithFieldName: function(fieldName, req) {
    let contentSearch = req.query["contentSearch"];
    if(contentSearch === null || contentSearch === undefined) {
        contentSearch = '';
    }
    let fieldNameObject = {};
    if (fieldName.includes("_id") === true) {
      fieldNameObject[fieldName] = objectID(contentSearch);
    } else {
      var regex = new RegExp(
        ".*" + this.escapeRegExp(contentSearch) + ".*",
        "i"
      );
      fieldNameObject[fieldName] = regex;
    }
    return fieldNameObject;
  },
  buildAggregateQueryWithFieldNameAndParamName: function(
    fieldName,
    paramName,
    req
  ) {
    let contentSearch = req.query[paramName];

    let fieldNameObject = {};
    if (
      contentSearch === null ||
      contentSearch === undefined ||
      contentSearch === ""
    ) {
      fieldNameObject[fieldName] = null;
    } else if (fieldName.includes("_id") === true) {
      fieldNameObject[fieldName] = objectID(contentSearch);
    } else {
      fieldNameObject[fieldName] = contentSearch;
    }
    return fieldNameObject;
  }
};
module.exports = generalUtil;
