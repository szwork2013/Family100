/**
 * Author: VincentBel
 * Date: 15/10/13
 */
var express = require('express');
var router = express.Router();
var requireAdmin = require('./middleware').requireAdmin;

var productController = require('../app/controllers/products');

router.route('/')
  .get(productController.list)  // 获取商品列表
  .post(requireAdmin, productController.create); //增加一个商品

router.route('/:id')
  .get(productController.getProductById)
  .put(requireAdmin, productController.updateProductById);


router.route('/:productId/variants').get(productController.listVariant)  // get all variants of the product
  .post(requireAdmin, productController.createVariant); // create a new variant

router.get('/test/add', productController.testAdd);

module.exports = router;
