/**
 * Author: VincentBel
 * Date: 15/11/6
 */

var glob = require('glob');
var Promise = require('bluebird');
var mongoose = require('mongoose');
import app from '../app';
var Material = mongoose.model('Material');

var basePath = '/Users/VincentBel/Project/FrontEnd/Family100_QiNiu/Upload/materials/';

var bashUrl = 'http://7xnl26.com2.z0.glb.qiniucdn.com/materials/';

describe('Add material to database', () => {
  it('should add without err', () => {
    var files = glob.sync(basePath + '/*');
    var materialPromises = files.map(file => {
      const name = file.substring(basePath.length);
      console.log(`name: ${name}`);

      var details = glob.sync(basePath + '/' + name + '/detail/*');
      var companyImages = glob.sync(basePath + '/' + name + '/company/*');

      console.log(`details: ${details}`);
      console.log(`companyImages: ${companyImages}`);


      var json = require(glob.sync(basePath + '/' + name + '/*.json')[0]);

      console.log(json);

      var material = new Material({
        name,
        displayName: json.displayName,
        logo: bashUrl + name + '/logo.jpg',
        introduction: json.introduction,
        banner: bashUrl + name + '/banner.jpg',
        companyName: json.companyName,
        companyImages: companyImages.map(company => bashUrl + company.substring(basePath.length)),
        detailImages: details.map(detail => bashUrl + detail.substring(basePath.length))
      });

      return material.save();
    });

    return Promise.all(materialPromises);

  });
});

