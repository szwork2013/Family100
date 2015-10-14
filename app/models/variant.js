/**
 * Author: VincentBel
 * Date: 15/10/13
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Schema
 */
var VariantSchema = new Schema({
  name: String,
  sku: String,
  price: String, // 价格
  active: Boolean, // 是否可用
  productId: {type: Schema.Types.ObjectId, ref: 'Product'},
  imageId: Schema.Types.ObjectId, // 对应的图片

  // 还有其他的属性自动添加

  createdAt: {type: Date},
  updatedAt: {type: Date}
});

/**
 * pre
 */
VariantSchema.pre('save', function (next) {
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

VariantSchema.path('name').validate(function (name) {
  return name.length;
}, 'Name cannot be blank');

/**
 * Methods
 */

VariantSchema.methods = {
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


VariantSchema.statics = {

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

mongoose.model("Variant", VariantSchema);
