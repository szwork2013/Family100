/**
 * Author: VincentBel
 * Date: 15/11/6
 */

var glob = require('glob');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var fs = require('fs');
import app from '../app';
var Material = mongoose.model('Material');

var basePath = '/Users/VincentBel/Project/FrontEnd/Family100_QiNiu/Upload/materials/';

var bashUrl = 'http://7xnl26.com2.z0.glb.qiniucdn.com/materials/';

describe('Materials', () => {
  describe('Add material details to database', () => {
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

  describe('exports materials to json', () => {
    it('should response without err', (done) => {
      var files = glob.sync(basePath + '/*');

      var materials = files.map(file => {
        const materialName = file.substring(basePath.length);
        const typePath = basePath + materialName + '/types/';

        var types = glob.sync(typePath + '/*');

        var items = types.map(type => {
          const typeName = type.substring(typePath.length);
          var json = require(glob.sync(typePath + typeName + '/*.json')[0]);
          return {
            image: bashUrl + materialName + '/types/' + typeName + '/sample.jpg',
            name: typeName,
            displayName: json.displayName,
            specs: json.specs
          };
        });

        var materialJson = require(glob.sync(basePath + '/' + materialName + '/*.json')[0]);

        return {
          name: materialName,
          displayName: materialJson.displayName,
          detailLink: `/materials/${materialName}`,
          banner: bashUrl + materialName + '/banner.jpg',
          items: items
        }
      });
      fs.writeSync('./materials.json', JSON.stringify(materials));
      done();
    });
  });

});

