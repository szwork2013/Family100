var express = require('express');
var router = express.Router();
var requireAuth = require('./middleware').requireAuth;

var userController = require('../app/controllers/users');

/* GET users listing. */
router.route('/')
  .post(userController.createAndSaveHouse);

router.get('/show', requireAuth, userController.show);

router.route('/sms')
  .get(userController.sendSMSCode) // Todo 为了前端方便,也接受get请求,改进后取消
  .post(userController.sendSMSCode);

module.exports = router;
