/**
 * Author: VincentBel
 * Date: 15/10/10.
 */
var express = require('express');
var router = express.Router();

var categoryController = require('../app/controllers/categories');

router.route('/')
  .get(categoryController.nestedList)  // 获取嵌套的商品类别
  .post(categoryController.create); // 新建一个类别

module.exports = router;
