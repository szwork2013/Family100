/**
 * Author: VincentBel
 * Date: 15/8/24.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var HouseSchema = new Schema({
  name: String,  // 名称
  owner: String,  // 业主名称 Todo 可能会是用户，需要加上用户id
  area: Number,  // 户型面积
  package: Schema.Types.ObjectId, // 套餐
  province: String, // 省
  city: String,  // 市
  county: String, // 县
  town: String, // 镇
  detailAddress: String, // 详细地址
  progress: [{  // 施工进度
    time: Date,  // 时间
    constructionItems: [String],  // 施工项目
    constructionPeople: [{   // 施工人员
      task: String,  // 任务
      people: [String]  // 人员
    }],
    constructionImages: [String]  // 施工图片的网址
  }]
});

mongoose.model('House', HouseSchema);
