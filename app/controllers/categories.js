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
