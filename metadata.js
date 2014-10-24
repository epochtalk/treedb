var path = require('path');
var TreeDB = require(path.join(__dirname, 'treedb'));

TreeDB.prototype.metadata = function(meta, type, sortField, parentKey, cb) {
  this.indexer.metadata(meta, type, sortField, parentKey, cb);
};
