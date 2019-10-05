const express = require('express');
let App = express();

App.use('/', require('./homepage'));
App.use('/auth', require('./auth_controllers'));
App.use('/user', require('./user_controllers'));
App.use('/extension', require('./extension_controller'));
App.use('/recruitment', require('./recruitment_controller'));
module.exports = App;