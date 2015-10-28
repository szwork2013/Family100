/**
 * Author: VincentBel
 * Date: 15/10/27
 */

var express = require('express');
var router = express.Router();
var requireAuth = require('./middleware').requireAuth;
var WXPay = require('../libs/wxpay');
var orderController = require('../app/controllers/orders');


router.get('/designorder', requireAuth, orderController.getDesignOrder);

router.route('/wxpay/native/callback', WXPay.useWXCallback(orderController.wxpayCallback));

router.get('/:orderId/payment', requireAuth, orderController.createPayment);
router.get('/:orderId/payment/status', requireAuth, orderController.checkPaymentStatus);

module.exports = router;
