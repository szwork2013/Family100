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
 * 获取用户信息
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
 * 获取酷家乐的登录链接
 *
 * @param userModel
 * @returns {Promise}
 */
function getKuJiaLeLoginUrl(userModel) {
  var kujiale = new KuJiaLe({
    appkey: config.kjlAppKey,
    appsecret: config.kjlAppSecret
  });

  return kujiale.getLoginUrl({
    id: userModel._id + '',
    name: userModel.name,
    phoneNumber: userModel.phoneNumber
  });
}

/**
 * Create user, 注册
 */

exports.create = function (req, res, next) {

  var phoneNumber = req.body.phoneNumber;
  var smsCode = req.body.smsCode;

  if (!validator.isMobilePhone(phoneNumber, 'zh-CN')) {
    return res.jsont({
      message: '手机号格式不正确'
    })
  }

  User.findByPhoneNumber(phoneNumber)
    .then(user => {
      if (user) {
        throw new Error('手机号已注册')
      }
      return true; // Todo return true 有点不大对劲
    }).then(() => {
    if (!YunPian.verify(phoneNumber, smsCode)) {
      throw new Error('短信验证码错误');
    }
    return true;
  }).then(() => {
    var user = new User(req.body);
    return user.save()
  }).then(user => [user, createKuJiaLeUser(user)])
    .spread((user, result) => {
      var json = user.toClient();
      json.token = jwt.sign(user, config.jwtSecretKey);
      json.kjlUrl = result.url;
      res.jsont(null, json);
    })
    .catch(err => res.jsont(err));
};

/**
 * 发送短信验证码
 */
exports.sendSMSCode = function (req, res, next) {

  var phoneNumber = req.body.phoneNumber || req.query.phoneNumber;

  if (!validator.isMobilePhone(phoneNumber, 'zh-CN')) {
    return res.jsont({
      message: '手机号格式不正确'
    })
  }

  var yunPian = new YunPian({
    apiKey: config.ypApiKey,
    companyName: '房美丽'
  });

  User.findByPhoneNumber(phoneNumber)
    .then(user => {
      if (user) {
        throw new Error('手机号已注册')
      }
      return true; // Todo return true 有点不大对劲
    }).then(() => yunPian.sendSMS(phoneNumber, req.ip))
    .then(result => {
      res.jsont(null, {
        success: true
      });

    }).catch(err => {
    res.jsont(err);
  })
};

exports.login = function (req, res, next) {
  var phoneNumber = req.body.phoneNumber;
  var password = req.body.password;

  if (!validator.isMobilePhone(phoneNumber, 'zh-CN')) {
    return res.jsont({
      message: '手机号格式不正确'
    })
  }

  User.findByPhoneNumber(phoneNumber)
    .then(user => {
      if (!user || !user.authenticate(password)) {
        throw new Error('手机号或密码错误');
      }
      return user;
    }).then(user => [user, getKuJiaLeLoginUrl(user)])
    .spread((user, result) => {
      var json = user.toClient();
      json.token = jwt.sign(user, config.jwtSecretKey);
      json.kjlUrl = result.url;
      res.jsont(null, json);
    })
    .catch(err => res.jsont(err));
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

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/login');
};