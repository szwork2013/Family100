/**
 * Author: VincentBel
 * Date: 15/10/23
 */

var fs = require('fs');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var OrderModel = mongoose.model('Order');
var ProductModel = mongoose.model('Product');
var WXPay = require('../../libs/wxpay');
var QRCode = require('qrcode');
var toDataURL = Promise.promisify(QRCode.toDataURL);
var config = require('../../config/config');

var wxpay = WXPay({
  appid: config.wxAppId,
  mch_id: config.wxMchId,
  partner_key: config.wxPartnerKey,
  pfx: fs.readFileSync(config.wxPfxPath)
});

function fetchWeiXinQRCode(order) {
  var name = order.combinedName;
  // Todo remove the following line after test
  var userIp = (order.userIp === '::1' || order.userIp === 'localhost') ? '127.0.0.1' : order.userIp;
  // remove the auto prefix ipv4 address, like: ::ffff:123.1.1.2
  userIp = userIp.startsWith('::ffff:') ? userIp.substr(7) : userIp;
  return wxpay.createUnifiedOrder({
    body: name,
    detail: name,
    out_trade_no: order._id + '', // convert to string is important
    total_fee: order.totalPrice * 100, // 微信支付的单位按「角」算，所以乘以100
    spbill_create_ip: userIp,
    trade_type: 'NATIVE',
    notify_url: 'http://family100.cn/wxpay/native/callback',
    product_id: order.items[0].productId + '' // convert to string is important
  }).then(result => {
    console.log(result);
    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      return Promise.reject('wechat pay: create unified order with error result code: ' + result.return_msg);
    }
    return result;
  }).then(result => {
    return [result, toDataURL(result.code_url)];
  }).spread((result, qrCodeDataURL) => {
    // Todo transform to standard api
    return Object.assign({}, result, {
      image: qrCodeDataURL
    });
  });
}


exports.createDesignPayment = function (req, res, next) {
  //var user = req.user;
  // Todo just test use auth
  var user = {_id: mongoose.Schema.Types.ObjectId()};
  getDesignProductModel()
    .then(product => {
      return new OrderModel({
        userId: user._id,
        items: [{
          name: product.name,
          quantity: 1,
          price: product.salePrice,
          productId: product._id
        }],
        userIp: req.ip
      }).save();
    }).then(fetchWeiXinQRCode)
    .then(result => {
      res.jsont(null, result);
    }).catch(err => {
      res.jsont(err);
    });
};

var designProductName = "3D云设计方案预付款";
var designProduct;

/**
 * 获取3D云设计方案预付款的 product model
 */
function getDesignProductModel() {
  if (designProduct) {
    return Promise.resolve(designProduct);
  }

  return ProductModel.findOneByName(designProductName) // 通过name查找Product
    .then(product => {
      if (!product) {  // 如果没找到，以这个name新建一个新的product，再返回
        return new ProductModel({
          name: designProductName,
          active: true,
          cost: 0.01,
          price: 0.01,
          salePrice: 0.01,
          images: {
            caption: '云设计图',
            url: ''
          },
          description: '此笔费用用于预约出房型的3D图，在确定在「房美丽」装修后会在装修总价中扣除，不额外收费'
        }).save();
      }
      return product;
    }).then(product => {
      designProduct = product;
      return product;
    });
}