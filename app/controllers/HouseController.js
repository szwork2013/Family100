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
