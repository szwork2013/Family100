/**
 * Author: VincentBel
 * Date: 15/10/23
 */

var util = require('./util');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var md5 = require('md5');
var parseXML = Promise.promisify(util.parseXML);

exports = module.exports = WXPay;

function WXPay() {

  if (!(this instanceof WXPay)) {
    return new WXPay(arguments[0]);
  }

  this.options = arguments[0];
  this.wxpayID = {appid: this.options.appid, mch_id: this.options.mch_id};
}

WXPay.prototype.option = function (option) {
  for (var k in option) {
    this.options[k] = option[k];
  }
};


WXPay.prototype.sign = function (param) {

  var querystring = Object.keys(param).filter(function (key) {
      return param[key] !== undefined && param[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0;
    }).sort().map(function (key) {
      return key + '=' + param[key];
    }).join("&") + "&key=" + this.options.partner_key;

  return md5(querystring).toUpperCase();
};

WXPay.prototype.check = function (info) {
  return info.appid === this.wxpayID.appid &&
    info.mch_id === this.options.mch_id;
};


WXPay.prototype.createUnifiedOrder = function (opts) {
  opts.nonce_str = opts.nonce_str || util.generateNonceString();
  opts = Object.assign(opts, this.wxpayID);
  opts.sign = this.sign(opts);

  console.log('===== request weixin pay code_url======');
  return request({
    url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
    method: 'POST',
    body: util.buildXML(opts),
    agentOptions: {
      pfx: this.options.pfx,
      passphrase: this.options.mch_id
    }
  }).spread(function (response, body) {
    console.log('===== request weixin pay code_url successfully======');
    return parseXML(body);
  });
};


WXPay.prototype.getBrandWCPayRequestParams = function (order, fn) {

  order.trade_type = "JSAPI";
  var _this = this;
  this.createUnifiedOrder(order, function (err, data) {
    var reqparam = {
      appId: _this.options.appid,
      timeStamp: Math.floor(Date.now() / 1000) + "",
      nonceStr: data.nonce_str,
      package: "prepay_id=" + data.prepay_id,
      signType: "MD5"
    };
    reqparam.paySign = _this.sign(reqparam);
    fn(err, reqparam);
  });
};

WXPay.prototype.createMerchantPrepayUrl = function (param) {

  param.time_stamp = param.time_stamp || Math.floor(Date.now() / 1000);
  param.nonce_str = param.nonce_str || util.generateNonceString();
  util.mix(param, this.wxpayID);
  param.sign = this.sign(param);

  var query = Object.keys(param).filter(function (key) {
    return ['sign', 'mch_id', 'product_id', 'appid', 'time_stamp', 'nonce_str'].indexOf(key) >= 0;
  }).map(function (key) {
    return key + "=" + encodeURIComponent(param[key]);
  }).join('&');

  return "weixin://wxpay/bizpayurl?" + query;
};


WXPay.useWXCallback = function (fn) {

  return function (req, res, next) {
    var _this = this;
    res.success = function () {
      res.end(util.buildXML({xml: {return_code: 'SUCCESS'}}));
    };
    res.fail = function () {
      res.end(util.buildXML({xml: {return_code: 'FAIL'}}));
    };

    util.pipe(req, function (err, data) {
      var xml = data.toString('utf8');
      util.parseXML(xml, function (err, msg) {
        req.wxmessage = msg;
        fn.apply(_this, [msg, req, res, next]);
      });
    });
  };
};


WXPay.prototype.queryOrder = function (query) {

  if (!(query.transaction_id || query.out_trade_no)) {
    return Promise.resolve({return_code: 'FAIL', return_msg: '缺少参数'});
  }

  query.nonce_str = query.nonce_str || util.generateNonceString();
  query = Object.assign(query, this.wxpayID);
  query.sign = this.sign(query);

  return request({
    url: "https://api.mch.weixin.qq.com/pay/orderquery",
    method: "POST",
    body: util.buildXML({xml: query})
  }).spread(function (response, body) {
    return parseXML(body);
  });
};


WXPay.prototype.closeOrder = function (order, fn) {

  if (!order.out_trade_no) {
    fn(null, {return_code: "FAIL", return_msg: "缺少参数"});
  }

  order.nonce_str = order.nonce_str || util.generateNonceString();
  util.mix(order, this.wxpayID);
  order.sign = this.sign(order);

  request({
    url: "https://api.mch.weixin.qq.com/pay/closeorder",
    method: "POST",
    body: util.buildXML({xml: order})
  }, function (err, res, body) {
    util.parseXML(body, fn);
  });
};