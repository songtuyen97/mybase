const database = require('../config/database');
const mongoose = require('mongoose');
let dbUtil = {
    connectToMongoDB: function(){
        let dbPath = '';
        
        dbPath += 'mongodb://' + database.mongodb.USER;
        dbPath += ':' + database.mongodb.PASS;
        dbPath += '@' + database.mongodb.HOST;
        dbPath += ':' + database.mongodb.PORT;
        dbPath += '/' + database.mongodb.DATABASE;

        mongoose.connect(dbPath, {useNewUrlParser: true}, function(err) {
            if(err) {
                console.log('CONNECT MONGODB IS ERROR:' + err);
                return;
            }
            console.log('CONNECT MONGODB IS SUCCESSFULLY!');
        });
    },
    getDocumentWithCondition: function(condition, selected, model, callback) {
        model.findOne(condition, selected, function(err, document) {
            if(err) {
                callback('ERROR_SERVER');
                return;
            }
            callback(document);
        })
    }
}
module.exports = dbUtil;