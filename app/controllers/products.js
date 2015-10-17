/**
 * Author: VincentBel
 * Date: 15/10/13
 */

var mongoose = require('mongoose');
var ProductModel = mongoose.model('Product');
var VariantModel = mongoose.model('Variant');

exports.getProductById = function (req, res, next) {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.jsont({
      code: 404,
      message: 'invalid id'
    });
  }

  ProductModel.findByIdAndPopulate(id)
    .then(product => {
      if (!product) {
        return res.jsont({
          code: 404,
          message: 'Product with id:' + id + ' Not Found!'
        })
      }
      return res.jsont(null, product.toClient());
    })
    .catch(err => res.jsont({
      code: 404,
      message: err
    }));
};

exports.updateProductById = function (req, res, next) {
  // Todo
  res.jsont(null, {message: 'todo'});
};

/**
 * 列出案例列表
 */
exports.list = function (req, res, next) {
  var page = (req.query.page > 0 ? req.query.page : 1) - 1;
  var perPage = 30;
  var sort = req.query.sort || 'createAt';
  var order = req.query.order || 'ASC';
  var filters = req.query.filter || [];

  var options = {
    perPage: perPage,
    page: page,
    sort: sort,
    order: order,
    filters: filters
  };

  ProductModel.list(options, function (err, articles) {
    if (err) {
      return res.jsont({
        code: 500,
        message: '无法获取商品列表，请重试',
        errors: [{
          message: err
        }]
      });
    }
    ProductModel.count().exec(function (err, count) {
      res.jsont(null, {
        itemsPerPage: perPage,
        totalItems: count,
        items: articles
      });
    });
  });
};

/**
 * 新建一个装修案例，保存相关信息
 * 注意，此方法只接受图片网址，没有上传图片功能
 */
exports.create = function (req, res, next) {

  const onSuccess = product => res.jsont(null, product);
  const onFailure = err => res.jsont({
    code: -101,
    message: '无法添加商品，请重试',
    errors: [{
      message: err
    }]
  });

  const variants = req.body.variants;
  if (variants) {
    VariantModel.deduplicateAndSave(variants)
      .then(variants => {
        const fields = Object.assign({}, req.body, {
          variants: variants.map(variant => variant._id)
        });
        return new ProductModel(fields).save();
      })
      .then(onSuccess)
      .then(null, onFailure); // Todo why .catch failed?
  } else {
    new ProductModel(req.body).save()
      .then(onSuccess)
      .catch(onFailure);
  }
};

/**
 * 给商品添加一个 variant
 */
exports.createVariant = function (req, res, next) {
  var productId = req.params.productId;
  var fields = Object.assign({}, req.query, {
    productId: productId
  });
  var variant = new VariantModel(fields);

  variant.save(function (err, variant) {
    if (err) {
      return res.jsont({
        code: 101,
        message: '无法添加variant，请重试',
        errors: [{
          message: err
        }]
      });
    }

    res.jsont(null, variant);
  });
};

exports.listVariant = function (req, res, next) {
  var productId = req.params.productId;
  var options = req.query; // Todo add options
  VariantModel.findByProductId(productId, function (err, variants) {
    if (err) {
      return res.jsont({
        code: 102,
        message: '获取失败，请重试',
        errors: [{
          message: err
        }]
      });
    }

    return jsont(null, variants);
  });
};

exports.testAdd = function (req, res, next) {

  // Returns a random integer between min (included) and max (excluded)
  // Using Math.round() will give you a non-uniform distribution!
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  var parentCount = 10;
  for (var i = 0; i < 40; i++) {
    var model = new ProductModel({
      name: ((i < parentCount) ? 'parent' : 'child') + i,
      active: true,
      navigation: true,
      description: Math.random(),
      image: 'http://placehold.it/40x40',
      subCategories: []
    });
    model.save();
  }

  ProductModel.find({}).exec(function (err, categories) {
    if (err) {
      return new Error('test error, cannot find categories');
    }
    var count = categories.length;
    for (var i = parentCount; i < count; ++i) {
      var parent = categories[getRandomInt(0, parentCount)];
      parent.subCategories.push(categories[i]._id);
      parent.save();
    }

    ProductModel.find({}).exec(function (err, categories) {
      res.json(categories);
    });

  });
};