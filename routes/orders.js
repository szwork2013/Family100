/**
 * Author: VincentBel
 * Date: 15/10/27
 */

var express = require('express');
var router = express.Router();
var requireAuth = require('./middleware').requireAuth;

var paymentController = require('../app/controllers/payments');

router.get(':orderId/payment/status', requireAuth, paymentController.checkPaymentStatus);

module.exports = router;
