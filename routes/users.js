var express = require('express');
var router = express.Router();

var userController = require('../app/controllers/users');

/* GET users listing. */
router.route('/')
  .get(function (req, res, next) {
    res.send('respond with a resource');
  })
  .post(userController.createAndSaveHouse);


router.route('/sms')
  .get(userController.sendSMSCode) // Todo 为了前端方便,也接受get请求,改进后取消
  .post(userController.sendSMSCode);

module.exports = router;
