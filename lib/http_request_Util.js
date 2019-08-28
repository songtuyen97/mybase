let httpRequestUtil = {
    trimPropertiesOfBodyRequest: function(req) {
        Object.keys(req.body).forEach(function(elem) {
            req.body[elem] = req.body[elem].trim();
        })
    }
}

module.exports = httpRequestUtil;