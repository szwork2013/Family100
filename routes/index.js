var users = require('./users');
var jwt = require('express-jwt');

module.exports = function (app, config) {

  /* GET home page. */
  app.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
  });

  app.use('/users', users);

  app.use(jwt({secret: config.jwtSecretKey}).unless({path: ['/token']}));


  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
};
