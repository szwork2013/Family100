/**
 * Author: VincentBel
 * Date: 15/11/6
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Schema
 */
var MaterialSchema = new Schema({
  name: {type: String, unique: true},
  displayName: String,
  logo: String,
  introduction: String,
  banner: String,
  companyName: String,
  companyImages: [String],
  detailImages: [String],
  createdAt: {type: Date},
  updatedAt: {type: Date}
});

/**
 * pre
 */
MaterialSchema.pre('save', function (next) {
  var now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

/**
 * Validations
 */

MaterialSchema.path('name').validate(function (name) {
  return name.length;
}, 'Name cannot be blank');

/**
 * Methods
 */

MaterialSchema.methods = {
  toClient: function () {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;

    return obj;
  }
};

/**
 * Statics
 */


MaterialSchema.statics = {

  findByName: function (name) {
    return this.findOne({name: name});
  },

  /**
   * List
   *
   * @param options
   * {
   *   criteria: 搜索标准
   *   perPage: 每页几个条目
   *   page: 第几页（从 0 开始）
   *   sort: 排序字段
   *   order: 排序方式：ASC 升序， DESC 降序
   * }
   *
   * @param cb callback(err, models)
   */
  list: function (options, cb) {
    var filters = options.filters || {};
    var sort = options.sort || 'createAt';
    var order = (options.order && options.order === 'DESC') ? -1 : 1;

    var sortExpression = {};
    sortExpression[sort] = order;

    this.find({})
      .sort(sortExpression)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
};

mongoose.model("Material", MaterialSchema);
