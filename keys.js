var keys = {};
module.exports = keys;
var crypto = require('crypto');
var shortId = require('shortid');

keys.longHash = function() {
  var shasum = crypto.createHash('sha256');
  var seed = crypto.randomBytes(20);
  shasum.update(seed);
  var h = shasum.digest('hex');
  return h;
};

keys.hash = function() {
  return shortId.generate();
};
