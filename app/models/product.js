/**
 * Author: VincentBel
 * Date: 15/10/12
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Schema
 */
var ProductSchema = new Schema({
  title: {type: String, unique: true},  // 名称
  active: Boolean, // 是否仍在使用
  cost: String, // 成本
  price: Number, // 价格
  salePrice: Number, // 销售价格
  attributes: [{ // 商品参数
    order: Number, // 顺序
    category: [{   // 参数的类别
      name: String, // 参数名称
      value: String // 参数值
    }]
  }],
  images: [{  // 商品图片
    id: Schema.Types.ObjectId,
    caption: String, // 说明
    url: String,
    uploadDate: {type: Date, default: Date.now}
  }],
  options: [{ // 商品的选项，例如 T-shirt 有 Size, Color 等 options
    id: Schema.Types.ObjectId,
    name: String, // 选项名称，例如： Color,
    variantKey: String, // 在 variant collection 中的 key
    order: Number, // 排序位置
    values: [String] // 选项值，例如：Green、Yellow
  }],
  variants: [{type: Schema.Types.ObjectId, ref: 'Variant'}],
  categoryId: {type: Schema.Types.ObjectId, ref: 'Category'}, // 商品类别
  description: String, // 说明
  createdAt: {type: Date},
  updatedAt: {type: Date}
});

/**
 * pre
 */
ProductSchema.pre('save', function (next) {
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

ProductSchema.path('title').validate(function (name) {
  return name.length;
}, 'Title cannot be blank');

/**
 * Methods
 */

ProductSchema.methods = {
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


ProductSchema.statics = {

  /**
   * 根据 id 获取商品详情并populate variants
   * @param id
   * @param cb
   */
  findByIdAndPopulate: function (id, cb) {
    if (!id) {
      return cb(new Error('product id cannot be blank!'));
    }

    this.find({_id: id})
      .populate("variants")
      .exec(cb);
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

mongoose.model("Product", ProductSchema);
