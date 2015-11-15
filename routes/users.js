var express = require('express');
var router = express.Router();
var requireAuth = require('./middleware').requireAuth;

var userController = require('../app/controllers/users');


router.get('/show', requireAuth, userController.show);

router.post('/passwordReset', userController.resetPassword);

router.post('/passwordReset/auth', userController.getResetPasswordAuth);

router.route('/sms')
  .get(userController.sendRegisterSMSCode) // Todo 为了前端方便,也接受get请求,改进后取消
  .post(userController.sendRegisterSMSCode);


router.post('/sms/passwordReset', userController.sendResetPasswordSMSCode);

module.exports = router;
