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
  name: {type: String, default: ''},  // 名称
  owner: {type: String, default: ''},  // 业主名称 Todo 可能会是用户，需要加上用户id
  area: Number,  // 户型面积
  package: Schema.Types.ObjectId, // 套餐
  province: {type: String, default: ''}, // 省
  city: {type: String, default: ''},  // 市
  county: {type: String, default: ''}, // 县
  town: {type: String, default: ''}, // 镇
  detailAddress: {type: String, default: ''}, // 详细地址
  progress: [{  // 施工进度
    time: Date,  // 时间
    constructionItems: [String],  // 施工项目
    constructionPeople: [{   // 施工人员
      task: {type: String, default: ''},  // 任务
      people: [String]  // 人员
    }],
    constructionImages: [String],  // 施工图片的网址
    createdAt: {type: Date, default: Date.now}
  }]
});

/**
 * Validations
 */

HouseSchema.path('name').validate(function (name) {
  return name.length;
}, 'Name cannot be blank');

/**
 * Methods
 */

/**
 * Statics
 */

mongoose.model('House', HouseSchema);
