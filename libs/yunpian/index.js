/**
 * Author: VincentBel
 * Date: 15/11/5
 */

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var cache = require('memory-cache');

/**
 * @param options
 * {
 *    apiKey: 云片的apikey 必须
 *    companyName: 公司名称,必须
 *    template: 短信模板, 非必须(请将公司名称填入,code使用 #code# 占位),
 *    codeLength: 验证码长度, 非必须, 默认4
 *    lifetime: 验证码的有限时间,非必须,默认1小时
 * }
 *
 * @returns {YunPian}
 * @constructor
 */
function YunPian(options) {
  if (!(this instanceof YunPian)) {
    return new YunPian(options);
  }

  this.options = options;

  if (!this.options.apiKey) {
    throw new Error('need a apiKey to initialize YunPian service');
  }

  this.options.template = this.options.template ||
    `【${this.options.companyName}】您的验证码是#code#。如非本人操作，请忽略本短信`;

  this.options.codeLength = this.options.codeLength || 4;
  this.options.lifetime = this.options.lifetime || 1 * 60 * 60 * 1000;
}

/**
 * 发送短信验证码
 *
 * @param phoneNumber 手机号
 * @param ip 用户ip, 用于防止攻击
 */
YunPian.prototype.sendSMS = function (phoneNumber, ip) {
  var code = generateRandomFixLengthString(this.options.codeLength);

  return checkRequest(ip)
    .then(() => {
      // 存储到内存中
      return cache.put(phoneNumber, code, this.options.lifetime);
    }).then(() => {
      var form = {
        apikey: this.options.apiKey,
        mobile: phoneNumber,
        text: this.options.template.replace('#code#', code)
      };

      return request({
        url: 'http://yunpian.com/v1/sms/send.json',
        method: 'POST',
        form: form
      })
    }).spread((response, body) => {
      if (body.code != 0) {
        // 说明返回有错误
        console.log(body);
        // Todo 可能是余额不足,通知
      }

      return body.result;
    });
};

YunPian.verify = function (phoneNumber, code) {
  return cache.get(phoneNumber) === code;
};

/**
 * 检测是否是恶意攻击
 */
function checkRequest(ip) {
  var lifetime = 1 * 60 * 60 * 1000; // 单位 ms
  var ipMinInterval = 3000; // 同一ip发送请求的最短间隔时间, 单位 ms
  var ipMaxCount = 30; // 同一ip在1小时内最多发送的短信数量
  //var userMaxCount = 3; // 同一手机号1小时内最大发送条数 [云片已经处理]

  var ipInfo = cache.get(ip);

  var now = Date.now();
  if (ipInfo && now - ipInfo.createdAt < lifetime) {
    // 如果改ip存在并且在1小时内有过请求

    if (now - ipInfo.updatedAt <= ipMinInterval) {
      ipInfo.updatedAt = now;
      cache.put(ip, ipInfo, lifetime);
      return Promise.reject({code: 1, message: 'send sms request too frequently'});
    }

    if (ipInfo.count >= ipMaxCount) {
      ipInfo.count++;
      cache.put(ip, ipInfo, lifetime);
      return Promise.reject({code: 1, message: 'send sms request too frequently'});
    }
  } else {
    cache.put(ip, {
      createdAt: now,
      updatedAt: now,
      count: 1
    }, lifetime);
  }
  return Promise.resolve(ipInfo);
}

function generateRandomFixLengthString(length) {
  return Math.random().toString().slice(2, 2 + length);
}

module.exports = YunPian;
