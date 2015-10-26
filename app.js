var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose'),
  qiniu = require('qiniu');

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', () => {
  throw new Error('unable to connect to database at ' + config.db);
});
db.on('connected', () => {
  console.log('connect to mongodb successfully');

  // After connected, use bluebird as mongoose promise
  mongoose.Promise = require('bluebird');
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(model => require(model));

var app = express();

// 七牛的配置

qiniu.conf.ACCESS_KEY = config.qiniuAccessKey;
qiniu.conf.SECRET_KEY = config.qiniuSecretKey;

if (!module.parent) { // 防止和 mocha 冲突
  var server = app.listen(
    config.port,
    () => console.log('Express server listening on port ' + config.port)
  );
}

var io = require('socket.io')(server);
require('./config/express')(app, config, io);

module.exports = app;
