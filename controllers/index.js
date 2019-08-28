const express = require('express');
let App = express();

App.use('/', require('./homepage'));
App.use('/auth', require('./auth'))

module.exports = App;