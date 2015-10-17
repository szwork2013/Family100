/**
 * Author: VincentBel
 * Date: 15/10/13
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var find = require('lodash/collection/find');

/**
 * Schema
 */
var VariantSchema = new Schema({
  name: String,
  sku: String,
  price: String, // 价格
  active: Boolean, // 是否可用
  //productId: {type: Schema.Types.ObjectId, ref: 'Product'},
  image: String, // 对应的图片

  options: {}, // 还有其他的属性自动添加到 options 中

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
   * 根据商品id获取单个商品所有的variant
   *
   * @param productId
   * @param cb
   */
  findByProductId: function (productId, cb) {

    this.find({productId: productId})
      .exec(cb);
  },


  deduplicateAndSave: function (variants, productOptions, cb) {
    var uniqVariants = [];
    var identifier = [];
    variants.forEach(variant => {
      if (!find(identifier, variant.options)) {
        uniqVariants.push(variant);
        identifier.push(variant.options);
      }
    });

    // Todo Check If all the variants is on productOptions
    //uniqVariants.forEach(variant => {
    //  const options = variant.options;
    //  for (const option in options) {
    //    if (options.hasOwnProperty(option)) {
    //      find(productOptions, productOption => {
    //        return productOption.variantKey && productOption.variantKey === option;
    //      });
    //    }
    //  }
    //});
    return this.create(uniqVariants, cb);
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

mongoose.model("Variant", VariantSchema);
