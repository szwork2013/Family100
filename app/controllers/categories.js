/**
 * Author: VincentBel
 * Date: 15/10/10.
 */

var mongoose = require('mongoose');
var CategoryModel = mongoose.model('Category');

exports.nestedList = function (req, res, next) {
  CategoryModel.nestedList(function (err, categories) {
    if (err) {
      return res.jsont(err);
    }

    var categoriesJson = categories.map(function (category) {
      return category.toClient();
    });

    categories.forEach(function (category, index) {
      var subCategories = category.subCategories;
      if (subCategories && subCategories.length) {
        categoriesJson[index].subCategories = subCategories.map(function (subCategory) {
          return subCategory.toClient();
        });
      }
    });

    res.jsont(null, categoriesJson);
  })
};

/**
 * 创建一个新的商品类别
 *
 * 如果是创建子类别，则需有效的 req.body.parentId
 */
exports.create = function (req, res, next) {
  // 父类别 id
  const parentId = req.body.parentId;

  if (parentId) {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.jsont({
        code: 500,  // Todo 定义好code
        message: 'parent Id is not valid'
      });
    }

    return CategoryModel.findById(parentId).exec()
      .catch(err => res.jsont(err)) // parent id 未找到，返回错误
      .then(category => [category, new CategoryModel(req.body).save()])
      .spread((parentCategory, subCategory) => {
        parentCategory.addSubCategory(subCategory);
        return subCategory;
      })
      .then(category => res.jsont(null, category))
      .catch(err => res.jsont(err));
  } else {
    // 如果参数中没有 parentId，则保存为一级目录
    new CategoryModel(req.body).save()
      .then(category => res.jsont(null, category))
      .catch(err => res.jsont(err));
  }
};


// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

exports.testAdd = function (req, res, next) {
  var parentCount = 10;
  for (var i = 0; i < 40; i++) {
    var model = new CategoryModel({
      name: ((i < parentCount) ? 'parent' : 'child') + i,
      active: true,
      navigation: true,
      description: Math.random(),
      image: 'http://placehold.it/40x40',
      subCategories: []
    });
    model.save();
  }

  CategoryModel.find({}).exec(function (err, categories) {
    if (err) {
      return new Error('test error, cannot find categories');
    }
    var count = categories.length;
    for (var i = parentCount; i < count; ++i) {
      var parent = categories[getRandomInt(0, parentCount)];
      parent.subCategories.push(categories[i]._id);
      parent.save();
    }

    CategoryModel.find({}).exec(function (err, categories) {
      res.json(categories);
    });

  });
};
