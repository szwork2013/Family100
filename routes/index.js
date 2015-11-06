var users = require('./users');
var cases = require('./cases');
var categories = require('./categories');
var products = require('./products');
var orders = require('./orders');
var materials = require('./materials');
var userController = require('../app/controllers/users');
var KuJiaLe = require('../libs/kujiale');

var middleware = require('./middleware');
var requireAuth = middleware.requireAuth;

module.exports = function (app, config) {

  app.use(middleware.jsont);

  // allow CORS
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');  // Todo 特定的跨越请求，而不是全部
    //res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Accept,Content-Type,x-access-token');

    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.get('/', function (req, res, next) {
    res.jsont(null, {good: 'night'});
  });

  app.use('/users', users);

  app.use('/cases', cases);

  app.use('/categories', categories);

  app.use('/products', products);

  app.use('/orders', orders);

  app.use('/materials', materials);

  app.post('/register', userController.create);

  /**
   * 代理到酷家乐的网站
   */
  app.use('/apartments', KuJiaLe.getApartments);

  app.use('/communities', KuJiaLe.getCommunities);

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
      res.jsont({
        code: err.status || 500,
        message: err.message,
        errors: err
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.jsont('error', {
      code: err.status || 500,
      message: err.message,
      errors: {}
    });
  });
};
