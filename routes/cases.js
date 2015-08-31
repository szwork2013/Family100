/**
 * Author: VincentBel
 * Date: 15/8/27.
 */
var express = require('express');
var router = express.Router();

var HouseController = require('../app/controllers/HouseController');

router.route('/')
  .get(HouseController.getCaseById)  // 获取案例列表
  .post(HouseController.create);     // 新建一个案例



/**
 * 根据case id 获取 case
 */
router.get('/:id', HouseController.getCaseById);

module.exports = router;
