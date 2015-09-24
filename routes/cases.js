/**
 * Author: VincentBel
 * Date: 15/8/27.
 */
var express = require('express');
var router = express.Router();

var houseController = require('../app/controllers/houses');

router.route('/')
  .get(houseController.list)  // 获取案例列表
  .post(houseController.create);     // 新建一个案例



/**
 * 根据case id 获取 case
 */
router.get('/:id', houseController.getCaseById);

module.exports = router;
