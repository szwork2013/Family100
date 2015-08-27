/**
 * Author: VincentBel
 * Date: 15/8/27.
 */
var express = require('express');
var router = express.Router();

var HouseController = require('../app/controllers/HouseController');

/* GET cases list. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

/**
 * 根据case id 获取 case
 */
router.get('/:id', HouseController.getCaseById);

module.exports = router;
