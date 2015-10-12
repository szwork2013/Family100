/**
 * Author: VincentBel
 * Date: 15/10/10.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Schema
 */

var CategorySchema = new Schema({
  name: {type: String, default: '', unique: true},  // 名称
  active: Boolean, // 是否仍在使用
  navigation: Boolean, // 是否放在导航栏
  description: String, // 说明
  image: String,  // 图片
  subCategories: [{type: Schema.Types.ObjectId, ref: 'Category'}], // 子级类别id，如果没有子级，则为空
  createdAt: {type: Date, default: Date.now}
});

/**
 * Validations
 */

CategorySchema.path('name').validate(function (name) {
  return name.length;
}, 'Name cannot be blank');

/**
 * Methods
 */

CategorySchema.methods = {
  toClient: function () {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    delete obj.subCategories;

    return obj;
  }
};

/**
 * Statics
 */
CategorySchema.statics = {
  nestedList: function (cb) {
    this.find({
      subCategories: {$not: {$size: 0}}
    }).populate('subCategories')
      .exec(cb);
  }
};

mongoose.model('Category', CategorySchema);
