/**
 * Author: VincentBel
 * Date: 15/10/27
 */
var config = require('../config/config');

/**
 * 定义全局的JSON返回格式
 *
 * 返回时使用 res.jsont(err, data) 即可 （jsont => json template)
 */
exports.jsont = function (req, res, next) {
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
};

function requireAuth(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {
    var jwt = require('jsonwebtoken');

    // verifies secret and checks exp
    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
      if (err) {
        return res.status(403).jsont({
          code: 403,
          message: 'Failed to authenticate token.'
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.user = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).jsont({
      code: 403,
      message: 'No token provided.'
    });
  }
}

exports.requireAuth = requireAuth;

exports.requireAdmin = function (req, res, next) {
  requireAuth(req, res, function (req, res) {
    if (!req.user.admin) {
      return res.status(403).jsont({
        code: 403,
        message: 'permission deny.'
      });
    }

    next();
  });
};
