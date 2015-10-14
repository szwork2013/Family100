/**
 * Author: VincentBel
 * Date: 15/10/13
 */
var express = require('express');
var router = express.Router();

var productController = require('../app/controllers/products');

router.route('/')
  .get(productController.list)  // 获取商品列表
  .post(productController.create); //增加一个商品

router.get('/:id', productController.getCaseById);

router.get('/test/add', productController.testAdd);

module.exports = router;
