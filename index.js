var path = require('path');
var defined = require('defined');
var TreeDB = require(path.join(__dirname, 'treedb'));
require(path.join(__dirname, 'store'));
require(path.join(__dirname, 'get'));
require(path.join(__dirname, 'nodes'));
require(path.join(__dirname, 'children'));
require(path.join(__dirname, 'add-index'));
require(path.join(__dirname, 'add-secondary-index'));

TreeDB.prototype.metadata = function(meta, type, sortField, parentKey, cb) {
  this.indexer.metadata(meta, type, sortField, parentKey, cb);
};

module.exports = TreeDB;
