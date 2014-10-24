var path = require('path');
var TreeDB = require(path.join(__dirname, 'treedb'));

TreeDB.prototype.addSecondaryIndex = function(type, parentType, field, cb) {
  this.indexer.addSecondaryIndex(type, parentType, field, cb);
};
