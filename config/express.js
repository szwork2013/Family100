var logger = require('morgan');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');

module.exports = function (app, config) {
  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(compress());
  app.use(methodOverride());

  //var controllers = glob.sync(config.root + '/app/controllers/*.js');
  //controllers.forEach(function (controller) {
  //  require(controller)(app);
  //});

  // routes
  require(config.root + '/routes/index')(app, config);
};
