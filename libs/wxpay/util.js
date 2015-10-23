/**
 * Author: VincentBel
 * Date: 15/10/23
 */

var xml2js = require('xml2js');

exports.buildXML = function (json) {
  var builder = new xml2js.Builder();
  return builder.buildObject(json);
};

exports.parseXML = function (xml, fn) {
  var parser = new xml2js.Parser({trim: true, explicitArray: false, explicitRoot: false});
  parser.parseString(xml, fn || function (err, result) {
    });
};

exports.pipe = function (stream, fn) {
  var buffers = [];
  stream.on('data', function (trunk) {
    buffers.push(trunk);
  });
  stream.on('end', function () {
    fn(null, Buffer.concat(buffers));
  });
  stream.once('error', fn);
};

exports.generateNonceString = function (length) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var maxPos = chars.length;
  var noceStr = "";
  for (var i = 0; i < (length || 32); i++) {
    noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return noceStr;
};