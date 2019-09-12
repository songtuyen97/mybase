const http = require('http');
const express = require('express');
let App = express();
const environment = require('./config/environment');
const bodyParse = require('body-parser');
const middlewareUtil = require('./lib/middleware_Util');
const controllers = require('./controllers');
const dbUtil = require('./lib/db_Util');
const util = require('util');
// Middleware
App.use(bodyParse.json());
App.use(bodyParse.urlencoded({ extended: false }))

App.use(express.static('public'));

App.use(middlewareUtil.accessToken);
App.use(middlewareUtil.verifyToken);

App.use(controllers);

let server = http.createServer(App);

const io = require('socket.io')(server);
io.use(middlewareUtil.accessAndVerifyTokenSocketIO);
io.on('connection', function(socket) {
    console.log('socket:' + socket.id);
    let handshake = socket.handshake;
})

server.listen(environment.port, function() {
    console.log(`Server is running with port ${environment.port}`);
})
//connect to mongodb
dbUtil.connectToMongoDB();
