var express = require('express');
var router = express.Router();

var userController = require('../app/controllers/users');

/* GET users listing. */
router.route('/')
  .get(function (req, res, next) {
    res.send('respond with a resource');
  })
  .post(userController.createAndSaveHouse);


router.post('/sms', userController.sendSMSCode);

module.exports = router;
