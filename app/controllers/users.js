/**
 * Author: VincentBel
 * Date: 15/9/24.
 */

var mongoose = require('mongoose');
var User = mongoose.model('User');
var House = mongoose.model('House');
var jwt = require('jsonwebtoken');
var validator = require('validator');
var config = require('../../config/config');
var KuJiaLe = require('../../libs/kujiale');
var YunPian = require('../../libs/yunpian');

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
 * 创建一个酷家乐的用户
 *
 * @param userModel
 */
function createKuJiaLeUser(userModel) {
  var kujiale = new KuJiaLe({
    appkey: config.kjlAppKey,
    appsecret: config.kjlAppSecret
  });

  var planId = userModel.apartment.obsPlanId;
  var planName = userModel.apartment.planCity + '-' + userModel.apartment.name;

  return kujiale.createDesignAndGetLoginUrl({
    id: userModel._id + '',
    name: userModel.name,
    phoneNumber: userModel.phoneNumber
  }, planId, planName);
}

/**
 * Create user
 */

exports.create = function (req, res, next) {
  var user = new User(req.body);
  user.save()
    .then(user => [user, createKuJiaLeUser(user)])
    .spread((user, result) => {
      var json = user.toClient();
      json.token = jwt.sign(user, config.jwtSecretKey);
      json.kjlUrl = result.url;
      res.jsont(null, json);
    })
    .catch(err => res.jsont(err));
};


exports.sendSMSCode = function (req, res, next) {

  var phoneNumber = req.body.phoneNumber;

  if (!validator.isMobilePhone(phoneNumber, 'zh-CN')) {
    return res.jsont({
      message: 'invalid phone number'
    })
  }


  var yunPian = new YunPian({
    apiKey: config.ypApiKey,
    companyName: '房美丽'
  });

  yunPian.sendSMS(phoneNumber, req.ip)
    .then(result => {
      res.jsont(null, {
        success: true
      });

    }).catch(err => {
    res.jsont(err);
  })
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
