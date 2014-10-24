var path = require('path');
var TreeDB = require(path.join(__dirname, 'treedb'));

TreeDB.prototype.addIndex = function(type, field, cb) {
  this.indexer.addIndex(type, field, cb);
};
