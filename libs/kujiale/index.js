/**
 * Author: VincentBel
 * Date: 15/10/30
 */

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var md5 = require('md5');


function extractToken(url) {
  if (typeof url !== 'string') {
    return null;
  }

  var arr = url.match('accesstoken=(.*)');
  if (arr && arr.length) {
    return arr[1];
  }
  return null;
}

/**
 * @params options
 *   appkey:
 *   appsecret:
 *
 * @returns {KuJiaLe}
 * @constructor
 */
function KuJiaLe() {
  if (!(this instanceof KuJiaLe)) {
    return new KuJiaLe(arguments[0]);
  }

  this.options = arguments[0];
}

KuJiaLe.prototype.sign = function (timestamp, appuid) {
  appuid = appuid || '';
  var md5String = this.options.appsecret + this.options.appkey + appuid + timestamp;
  return md5(md5String);
};

/**
 * 创建一个用户
 *
 * @param options:
 *    id(或_id): 用户id, 必须
 *    name: 用户名, 必须
 *    phoneNumber: 手机号, 必须
 *    email: 邮箱，可选
 *    idCard: 身份证号，可选
 *    addr: 用户地址，可选
 *    avatar: 头像地址，可选
 *
 * * @param maxRecursiveTime 酷家乐系统错误时，最多重复发请求的次数
 *
 * @returns Promise
 */
KuJiaLe.prototype.createUser = function (options, maxRecursiveTime) {

  maxRecursiveTime = maxRecursiveTime || 5;

  var timestamp = Date.now();
  var appuid = options.id || options._id;

  var query = {
    appkey: this.options.appkey,
    timestamp: timestamp,
    sign: this.sign(timestamp, appuid),
    appuid: appuid,
    appuname: options.name || '',
    appuemail: options.email || '',
    appuphone: options.phoneNumber || '',
    appussn: options.idCard || '',
    appuaddr: options.addr || '',
    appuavatar: options.avatar || ''
  };

  return request({
    url: 'http://www.kujiale.com/p/openapi/login',
    method: 'POST',
    qs: query
  }).spread(function (response, body) {
    body = JSON.parse(body);
    switch (body.errorCode) {
      case 0: // 成功
        return {
          url: body.errorMsg,
          token: extractToken(body.errorMsg)
        };
      case 10001: //酷家乐系统内部错误
      default: // 说明发送参数有错
        console.log(body);
        return Promise.reject("酷家乐创建账号：发送参数有错");
        break;
    }
  });
};

module.exports = KuJiaLe;