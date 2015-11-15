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
var yunPian = new YunPian({
  apiKey: config.ypApiKey,
  companyName: '房美丽'
});

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
  return Promise.resolve({
    url: 'just fake'
  });

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
      json.token = jwt.sign(json, config.jwtSecretKey);
      json.kjlUrl = result.url;
      res.jsont(null, json);
    })
    .catch(err => res.jsont(err));
};

/**
 * 验证手机号并且发送短信
 *
 * @param phoneNumber 手机号
 * @param shouldUserExist 用户是否需要存在于数据库
 * @returns Promise
 */
function verifyAndSendSMSCode(phoneNumber, ip, shouldUserExist) {

  if (!validator.isMobilePhone(phoneNumber, 'zh-CN')) {
    return Promise.reject('手机号格式不正确');
  }

  return User.findByPhoneNumber(phoneNumber)
    .then(user => {
      if (!shouldUserExist && user) {
        throw new Error('手机号已注册')
      }
      if (shouldUserExist && !user) {
        throw new Error('用户不存在');
      }
      return true;
    }).then(() => yunPian.sendSMS(phoneNumber, ip));
}

/**
 * 注册时发送短信验证码
 */
exports.sendRegisterSMSCode = function (req, res, next) {
  var phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
  verifyAndSendSMSCode(phoneNumber, req.ip, false)
    .then(result => {
      res.jsont(null, {
        success: true
      });
    }).catch(err => {
    res.jsont(err);
  });
};

/**
 * 找回密码时发送短信验证码
 */
exports.sendResetPasswordSMSCode = function (req, res, next) {
  var phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
  verifyAndSendSMSCode(phoneNumber, req.ip, true)
    .then(result => {
      res.jsont(null, {
        success: true
      });
    }).catch(err => {
    res.jsont(err);
  });
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
      json.token = jwt.sign(json, config.jwtSecretKey);
      json.kjlUrl = result.url;
      res.jsont(null, json);
    })
    .catch(err => res.jsont(err));
};

/**
 *  Show profile
 */
exports.show = function (req, res, next) {
  var user = req.user;
  getKuJiaLeLoginUrl(user)
    .then(result => {
      user.kjlUrl = result.url;
      res.jsont(null, user);
    })
    .catch(err => res.jsont(err));
};

exports.getResetPasswordAuth = function (req, res, next) {
  var phoneNumber = req.body.phoneNumber;
  var smsCode = req.body.smsCode;

  if (!validator.isMobilePhone(phoneNumber, 'zh-CN')) {
    return res.jsont({
      message: '手机号格式不正确'
    })
  }

  User.findByPhoneNumber(phoneNumber)
    .then(user => {
      if (!user) {
        throw new Error('用户不存在')
      }
      return user;
    })
    .then((user) => {
      if (!YunPian.verify(phoneNumber, smsCode)) {
        throw new Error('短信验证码错误');
      }
      return user;
    })
    .then(user => {
      var expiresInSeconds = 1 * 60 * 60; // 1小时后过期
      res.jsont(null, {
        phoneNumber: phoneNumber,
        expiresIn: expiresInSeconds,
        token: jwt.sign(phoneNumber, config.jwtSecretKey, {
          expiresIn: expiresInSeconds
        })
      });
    }).catch(err => {
    res.jsont(err);
  })
};

exports.resetPassword = function (req, res, next) {
  var token = req.body.token;
  var password = req.body.password;
  console.log(req.body);

  if (!token || !password) {
    res.jsont({
      code: 403,
      message: 'token未提供'
    });
  }

  // verifies secret and checks exp
  jwt.verify(token, config.jwtSecretKey, function (err, phoneNumber) {
    if (err) {
      return res.jsont({
        code: 403,
        message: 'token不合法'
      });
    }

    User.findByPhoneNumberAndUpdate(phoneNumber, {password: password})
      .then(user => {
        // json web token 设为过期, 一个token只允许修改一次密码
        jwt.sign(phoneNumber, config.jwtSecretKey, {
          expiresIn: 0
        });

        return res.jsont(null, user.toClient());
      })
      .catch(err => res.jsont(err));

  });
};
