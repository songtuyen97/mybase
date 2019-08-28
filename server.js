const http = require('http');
const express = require('express');
let App = express();
const environment = require('./config/environment');
const bodyParse = require('body-parser');
const middlewareUtil = require('./lib/middleware_Util');
const controllers = require('./controllers');
const dbUtil = require('./lib/db_Util');
// Middleware
App.use(bodyParse.json());
App.use(bodyParse.urlencoded({ extended: false }))

App.use(express.static('public'));

App.use(middlewareUtil.accessToken);
App.use(middlewareUtil.verifyToken);

App.use(controllers);

let server = http.createServer(App);

server.listen(environment.port, function() {
    console.log(`Server is running with port ${environment.port}`);
})
//connect to mongodb
dbUtil.connectToMongoDB();
