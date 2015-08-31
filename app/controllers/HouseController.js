/**
 * Author: VincentBel
 * Date: 15/8/27.
 */

var mongoose = require('mongoose');
var HouseModel = mongoose.model('House');

exports.getCaseById = function (req, res, next) {
  HouseModel.findOne(req.param.id, function (err, house) {
    if (err) {
      return next(err);
    }

    if (!house) {
      return next(new Error('Not Found!'));
    }

    return res.jsont(null, house);
  });
};

/**
 * 新建一个装修案例，保存相关信息，并上传图片
 */
exports.create = function (req, res, next) {
  var house = new HouseModel(req.body);
  var images = req.files.image ? [req.files.image] : undefined;

  house.uploadAndSave(images, function (err) {
    if (err) {
      return res.jsont({
        code: 101,
        message: '无法保存案例，请稍后重试',
        errors: [{
          message: err
        }]
      });
    }

    res.jsont(null, house);
  });
};
