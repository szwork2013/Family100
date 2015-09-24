/**
 * Author: VincentBel
 * Date: 15/9/24.
 */

var mongoose = require('mongoose');
var User = mongoose.model('User');
var House = mongoose.model('House');

/**
 * Load
 */

exports.load = function (req, res, next, id) {
  var options = {
    criteria: {_id: id}
  };
  User.load(options, function (err, user) {
    if (err) return next(err);
    if (!user) return next(new Error('Failed to load User ' + id));
    req.profile = user;
    next();
  });
};

/**
 * Create user
 */

exports.create = function (req, res, next) {
  var user = new User(req.body);
  // user.provider = 'local';
  user.save(function (err, user) {
    if (err) {
      return res.jsont(err);
    }
    next(user);
  });
};

exports.createAndSaveHouse = function (req, res, next) {
  var user = new User(req.body);
  // user.provider = 'local';
  user.save(function (err, user) {
    if (err) {
      return res.jsont(err);
    }
    var house = new House(req.body);
    house.owner = user._id;
    house.save(function (err) {
      if (err) {
        return res.jsont(err);
      }
      return res.jsont(null, user);
    });
  });
};

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var user = req.profile;
  res.render('users/show', {
    title: user.name,
    user: user
  });
};

exports.signin = function (req, res) {
};

/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login'
  });
};

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
};

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/login');
};

/**
 * Session
 */

exports.session = login;

/**
 * Login
 */

function login(req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
}
