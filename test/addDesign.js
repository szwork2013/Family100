/**
 * Author: VincentBel
 * Date: 15/10/16
 */
var moment = require('moment');
var request = require('request');


describe('Add Designs', function () {
  it('should add a design', function (done) {
    var datetime = moment().format('YYYY-MM-DD-HHmm');
    var bashUrl = 'http://yun.kujiale.com';
    var j = request.jar();
    j.setCookie('qhssokey=3FO4K5U8GFLB6UD8DTH4A', bashUrl);
    j.setCookie('qhssokeycheck=3FO4K5U8GFLB', bashUrl);
    j.setCookie('qhssokeyid=6UD8DTH4A', bashUrl);
    var baseRequest = request.defaults({jar: j});

    baseRequest.post({
      url: bashUrl + '/api/floorplans/3FO4KHX67C2F' +
      '?floorplanname=%E4%B8%8A%E6%B5%B7_%E4%B8%87%E7%A7%91%E7%BA%A2%E9%83%A1_' + datetime
    }, function (err, response, body) {
      console.log('body:');
      console.log(body);
      var url = 'http://yun.kujiale.com/diy/deco/designid/' + body +
        '?redirecturl=http://yun.kujiale.com/design/' + body;
      baseRequest.get(url);
      done()
    });
  });
});
