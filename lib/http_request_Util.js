let httpRequestUtil = {
    trimPropertiesOfBodyRequest: function(req) {
        Object.keys(req.body).forEach(function(elem) {
            if(typeof req.body[elem] === 'string') req.body[elem] = req.body[elem].trim();
        })
    }
}

module.exports = httpRequestUtil;