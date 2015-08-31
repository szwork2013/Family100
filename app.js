var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose'),
  qiniu = require('qiniu');

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});
db.on('fullsetup', function () {
  console.log('connect to mongodb successfully');
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
var app = express();

require('./config/express')(app, config);

// 七牛的配置

qiniu.conf.ACCESS_KEY = config.qiniuAccessKey;
qiniu.conf.SECRET_KEY = config.qiniuSecretKey;

app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

