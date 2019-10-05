const http = require('http');
const express = require('express');
let App = express();
const environment = require('./config/environment');
const bodyParse = require('body-parser');
const middlewareUtil = require('./lib/middleware_Util');
const controllers = require('./controllers');
const dbUtil = require('./lib/db_Util');
const util = require('util');
const cors = require('cors');
// Middleware
App.use(bodyParse.json());
App.use(bodyParse.urlencoded({ extended: false }))

// App.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }
//   next();
// });
App.use(cors({origin: true, credentials: true}));

App.use(express.static('public'));

App.use(middlewareUtil.accessToken);
App.use(middlewareUtil.verifyToken);

let server = http.createServer(App);

const io = require('socket.io')(server);
io.use(middlewareUtil.accessAndVerifyTokenSocketIO);
io.on('connection', function(socket) {
})
App.use(function(req, res, next) {
    req.io = io;
    next();
})

App.use(controllers);

server.listen(environment.port, function() {
    console.log(`Server is running with port ${environment.port}`);
})
//connect to mongodb
dbUtil.connectToMongoDB();
