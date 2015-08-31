var users = require('./users');
var cases = require('./cases');
var jwt = require('express-jwt');

module.exports = function (app, config) {

  /**
   * 定义全局的JSON返回格式
   *
   * 返回时使用 res.jsont(err, data) 即可 （jsont => json template)
   */
  app.use(function (req, res, next) {
    res.jsont = function (err, data) {
      var json = {
        apiVersion: config.apiVersion
      };

      if (err) {
        json['error'] = err;
      } else {
        json['data'] = data;
      }

      res.json(json);
    };
    next();
  });

  // allow CORS
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');  // Todo 特定的跨越请求，而不是全部
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
  });

  app.get('/', function (req, res, next) {
    res.jsont(null, {good: 'night'});
  });

  app.use('/users', users);

  app.use('/cases', cases);

  // app.use(jwt({secret: config.jwtSecretKey}).unless({path: ['/token']}));


  //// catch 404 and forward to error handler
  //app.use(function (req, res, next) {
  //  var err = new Error('Not Found');
  //  err.status = 404;
  //  next(err);
  //});
  //
  //// error handlers
  //
  //// development error handler
  //// will print stacktrace
  //if (app.get('env') === 'development') {
  //  app.use(function (err, req, res, next) {
  //    res.status(err.status || 500);
  //    res.render('error', {
  //      message: err.message,
  //      error: err
  //    });
  //  });
  //}
  //
  //// production error handler
  //// no stacktraces leaked to user
  //app.use(function (err, req, res, next) {
  //  res.status(err.status || 500);
  //  res.render('error', {
  //    message: err.message,
  //    error: {}
  //  });
  //});
};
