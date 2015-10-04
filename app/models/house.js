/**
 * Author: VincentBel
 * Date: 15/8/24.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Schema
 */

var HouseSchema = new Schema({
  name: {type: String, default: '', unique: true},  // 名称
  owner: {type: Schema.Types.ObjectId, ref: 'User'},  // 业主
  area: Number,  // 户型面积
  package: {type: Number}, // 套餐 Todo 改为 ObjectId
  province: {type: String, default: ''}, // 省
  city: {type: String, default: ''},  // 市
  county: {type: String, default: ''}, // 县
  town: {type: String, default: ''}, // 镇
  detailAddress: {type: String, default: ''}, // 详细地址
  progress: [{  // 施工进度
    time: Date,  // 时间
    constructionItems: [String],  // 施工项目
    constructionPeople: [{   // 施工人员
      position: {type: String, default: ''},  // 任务
      name: [String]  // 人员
    }],
    constructionImages: [String]  // 施工图片的网址
  }],
  createdAt: {type: Date, default: Date.now}
});

/**
 * Validations
 */

HouseSchema.path('name').validate(function (name) {
  return name.length;
}, 'Name cannot be blank');

HouseSchema.path('owner').validate(function (owner) {
  return owner.length;
}, 'Owner cannot be blank');

/**
 * Methods
 */

HouseSchema.methods = {
  toClient: function () {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;

    return obj;
  },

  uploadAndSave: function (images, cb) {
    if (!images || !images.length) {
      return this.save(cb);
    }

    // Todo 上传到七牛云
    this.save(cb);
  }
};

/**
 * Statics
 */


HouseSchema.statics = {

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
   */
  list: function (options, cb) {
    var filters = options.filters || {};
    var sort = options.sort || 'createAt';
    var order = (options.order && options.order === 'DESC') ? -1 : 1;

    var sortExpression = {};
    sortExpression[sort] = order;

    console.log(options);

    console.log(sortExpression);

    this.find({})
      //.populate('user', 'name username')
      .sort(sortExpression)
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
};

mongoose.model('House', HouseSchema);
