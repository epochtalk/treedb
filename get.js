var path = require('path');
var TreeDB = require(path.join(__dirname, 'treedb'));
var noop = require(path.join(__dirname, 'noop'));

TreeDB.prototype.get = function(key, cb) {
  if (!cb) cb = noop;
  this.db.get(key, function(err, value) {
    return cb(err, {key: key, value: value});
  });
};

