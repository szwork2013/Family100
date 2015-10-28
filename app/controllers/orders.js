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

/**
 * 检查用户的3D设计订单是否已经存在，
 *   如果已存在，直接返回该订单
 *   如果不存在，则新增一个订单
 */
function getOrCreateDesignOrder(userId, product, userIp) {
  return OrderModel.getOrderByUserIdAndProductIds(userId, [product._id])
    .then(orders => {
      if (orders && orders.length) {
        if (orders.length > 1) {
          // 说明内部系统出问题了
          console.log(`Error!!! user with userId: ${userId} has more than one 3D design order!`);
        }
        return orders[0];
      } else {
        return new OrderModel({
          userId: userId,
          items: [{
            name: product.name,
            quantity: 1,
            price: product.salePrice,
            productId: product._id
          }],
          userIp: userIp
        }).save();
      }
    });
}

exports.getDesignOrder = function (req, res, next) {
  var user = req.user;

  var userIp = (req.ip === '::1' || req.ip === 'localhost') ? '127.0.0.1' : req.ip;
  // remove the auto prefix ipv4 address, like: ::ffff:123.1.1.2
  userIp = userIp.startsWith('::ffff:') ? userIp.substr(7) : userIp;

  getDesignProductModel()
    .then(product => {
      return getOrCreateDesignOrder(user._id, product, userIp)
    }).then(order => {
      res.jsont(null, order.toClient());
    }).catch(err => {
      err.code = err.code || 403;
      res.jsont(err);
    })
};

var wxpay = WXPay({
  appid: config.wxAppId,
  mch_id: config.wxMchId,
  partner_key: config.wxPartnerKey,
  pfx: fs.readFileSync(config.wxPfxPath)
});

function fetchWeiXinQRCode(order, maxRecursiveTime) {

  // 最多的重复请求次数
  maxRecursiveTime = maxRecursiveTime || 5;

  function processResult(order, result) {
    console.log('Wechat pay createUnifiedOrder result:');
    console.log(result);
    if (result.return_code !== 'SUCCESS') {
      throw new Error('wechat pay: create unified order with error return code: ' + result.return_msg);
    }

    if (result.result_code !== 'SUCCESS') {
      switch (result.err_code) {
        // 详见 https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=9_1
        case 'ORDERPAID': // 订单已支付
          // 查询订单，并保存到数据库
          return queryWxPayOrder(order._id)
            .then(result => {
              if (result.trade_state === 'SUCCESS') {
                // 交易状态为支付成功
                return saveWxPayToOrder(order, result);
              } else {
                // 说明微信返回的两次结果不统一
                throw new Error('Wechat pay: create unified order failed, try again later');
              }
            });
        case 'SYSTEMERROR': // 系统错误
          if (maxRecursiveTime <= 1) {
            throw new Error('wechat pay: create unified order return SYSTEMERROR more than 5 times');
          }
          return fetchWeiXinQRCode(order, maxRecursiveTime--);
        //case 'ORDERCLOSED': // 订单已关闭
        //case 'OUT_TRADE_NO_USED': // 商户订单号重复，同一笔交易不能多次提交
        default: //
          // 这些情况在系统运行正常时都不会出现问题，所以一定是内部系统出问题了
          throw new Error('Wechat pay: create unified order failed, try again later');
          break;
      }
    }

    return Promise.all([order, result, toDataURL(result.code_url)])
      .spread((order, result, qrCodeDataURL) => {
        return Object.assign({}, order.toClient(), {
          qrCodeURL: result.code_url,
          qrCodeImage: qrCodeDataURL
        });
      });
  }

  var name = order.combinedName;

  return wxpay.createUnifiedOrder({
    body: name,
    detail: name,
    out_trade_no: order._id + '', // convert to string is important
    total_fee: order.totalPrice * 100, // 微信支付的单位按「角」算，所以乘以100
    spbill_create_ip: order.userIp,
    trade_type: 'NATIVE',
    notify_url: 'http://family100.cn/orders/wxpay/native/callback',
    product_id: order.items[0].productId + '' // convert to string is important
  })
    .then(result => [order, result])
    .spread(processResult);
}

exports.createPayment = function (req, res, next) {
  var user = req.user;
  var orderId = req.params.orderId;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.jsont('invalid order id');
  }

  OrderModel.findById(orderId).exec()
    .then(order => {
      if (!order.userId.equals(user._id)) {
        throw new Error('permission deny');
      }
      return order;
    })
    .then(fetchWeiXinQRCode)
    .then(result => {
      res.jsont(null, result);
    }).catch(err => {
      err.code = err.code || 403;
      res.jsont(err);
    });
};

/**
 * 向微信查询订单
 */
function queryWxPayOrder(orderId, maxRecursiveTime) {

  maxRecursiveTime = maxRecursiveTime || 5;

  return wxpay.queryOrder({out_trade_no: orderId + ''})
    .then(result => {
      if (result.return_code !== 'SUCCESS') {
        throw new Error('wechat pay: queryOrder with error return message: ' + result.return_msg);
      }
      if (result.result_code !== 'SUCCESS') {
        switch (result.err_code) {
          case 'SYSTEMERROR':
            if (maxRecursiveTime <= 1) {
              throw new Error('wechat pay: queryOrder return SYSTEMERROR more than 5 times');
            }
            return queryWxPayOrder(orderId);
          default:
            throw new Error(`wechat pay: queryOrder with error code: ${result.err_code}`);
        }
      }
      return result;
    });
}


function saveWxPayToOrder(orderModel, msg) {
  var savedMessage = {
    transaction_id: msg.transaction_id,
    trade_type: msg.trade_type,
    total_fee: msg.total_fee,
    time_end: msg.time_end,
    openid: msg.openid,
    bank_type: msg.bank_type,
    cash_fee: msg.cash_fee,
    fee_type: msg.fee_type,
    is_subscribe: msg.is_subscribe,
    nonce_str: msg.nonce_str
  };
  return orderModel.payViaWx(savedMessage);
}

/**
 * 处理微信支付的回调：
 *   改变订单状态
 * @param msg 微信支付返回的信息
 */
exports.wxpayCallback = function (msg, req, res, next) {
  console.log('wechat callback');
  console.log(msg);

  if (msg.return_code !== 'SUCCESS' || msg.result_code !== 'SUCCESS' || !wxpay.check(msg)) {
    return res.fail();
  }

  var orderId = msg.out_trade_no;

  saveWxPayToOrder(OrderModel.findById(orderId), msg)
    .then(order => {
      res.success();
    }).catch(err => {
      console.log(err);
      res.fail();
    })
};

/**
 * 检查订单的支付状态
 */
exports.checkPaymentStatus = function (req, res, next) {
  var orderId = req.params.orderId;
  if (!mongoose.Schema.Types.ObjectId.isValid(orderId)) {
    res.jsont({
      code: 403,
      message: 'invalid order id'
    })
  }

  OrderModel.findById(orderId).exec()
    .then(order => {
      if (order.userId != req.user._id) {
        throw new Error('permissson deny');
      } else {
        res.jsont(null, {
          paid: order.paid,
          payVia: order.payVia
        })
      }
    }).catch(err => {
      err.code = 403;
      res.jsont(err);
    });
};
