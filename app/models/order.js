/**
 * Author: VincentBel
 * Date: 15/10/22
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var paymentList = {
  wxpay: 'wxpay',
  alipay: 'alipay'
};

/**
 * Schema
 */
var OrderSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: "User"},
  // cardId: {type: Schema.Types.ObjectId, ref: "Cart"}, // 购物车id
  items: [{
    id: Schema.Types.ObjectId,
    name: String,
    quantity: Number, // 数量
    price: Number, // 价格
    productId: {type: Schema.Types.ObjectId, ref: "Product"},
    variantId: {type: Schema.Types.ObjectId, ref: "Variant"}
  }],
  draft: Boolean,
  paid: Boolean, // 是否已经支付
  delivered: Boolean, // 是否已经派送
  hold: Boolean,
  canceled: Boolean, // 是否取消
  cancelledAt: Date, // 取消时间
  cancelReason: String, // 取消理由
  closed: Boolean,   // 是否关闭
  userIp: String, // 用户创建订单时的IP
  paidTime: Date, // 支付的时间
  payVia: String, // 支付的方式
  wxpay: {}, // 微信支付详细信息
  alipay: {},  // 支付宝支付详细信息
  createdAt: {type: Date},
  updatedAt: {type: Date}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

/**
 * pre
 */
OrderSchema.pre('save', function (next) {
  var now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

/**
 * Virtual
 */
OrderSchema.virtual('totalPrice')
  .get(function () {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

OrderSchema.virtual('combinedName')
  .get(function () {
    return this.items.reduce((name, item, index) =>
    name + (index === 0 ? '' : '\n') + item.name, '');
  });

/**
 * Validations
 */

//OrderSchema.path('name').validate(function (name) {
//  return name.length;
//}, 'Name cannot be blank');

/**
 * Methods
 */

OrderSchema.methods = {
  toClient: function () {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    delete obj.userIp;

    return obj;
  },
  /**
   * 通过微信支付成功
   *
   * @param message 微信支付返回的信息
   */
  payViaWx: function (message) {
    this.paid = true;
    this.canceled = false;
    this.closed = true;
    this.payVia = paymentList.wxpay;
    this.wxpay = message;
    this.paidTime = new Date();
    return this.save();
  }
};

/**
 * Statics
 */


OrderSchema.statics = {

  /**
   * 根据用户id 和 商品ids 获取订单
   * 商品 ids 必须完成匹配，不能多，不能少
   * @param userId
   * @param productIds
   */
  getOrderByUserIdAndProductIds: function (userId, productIds) {
    if (!Array.isArray(productIds)) {
      throw new Error('productIds must be an array');
    }
    return this.find({
      userId: userId,
      items: {
        $size: productIds.length,
        $all: productIds.map(productId => ({'$elemMatch': {productId}}))
      }
    }).exec();
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

mongoose.model("Order", OrderSchema);
