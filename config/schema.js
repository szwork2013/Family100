/**
 * Author: VincentBel
 * Date: 15/9/24.
 */

module.exports = function (mongoose) {

  var Schema = mongoose.Schema;

  // 给每个 Schema 添加一个 toClient 方法，将 _id 改为 id，
  // 同时删除 __v，用户还可以指定需要删除的字段
  Schema.method('toClient', function (deleteFields) {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;

    if (Array.isArray(deleteFields)) {
      var length = deleteFields.length;
      for (var i = 0; i < length; i++) {
        if (obj.hasOwnProperty(deleteFields[i])) {
          delete obj[deleteFields[i]];
        }
      }
    }

    return obj;
  });
};
