/**
 * Author: VincentBel
 * Date: 15/11/6
 */

var mongoose = require('mongoose');
var MaterialModel = mongoose.model('Material');


exports.getByName = function (req, res, next) {
  var name = req.params.materialName;

  MaterialModel.findByName(name).exec()
    .then(material => {
      if (!material) {
        var err = new Error('没有相关材料');
        err.code = 404;
        throw err;
      }
      res.jsont(nul, material.toClient());
    }).catch(err => res.jsont(err));
};