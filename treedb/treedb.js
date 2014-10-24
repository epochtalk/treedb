var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var TreeDBIndexer = require(path.join(__dirname, '..', 'indexer'));

var TreeDB = module.exports = function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
  this.branches = this.db.sublevel('branches');
  this.roots = this.db.sublevel('roots');
  this.indexes = this.db.sublevel('indexes');
  this.indexed = this.db.sublevel('indexed');
  this.meta = this.db.sublevel('meta');
  this.indexer = new TreeDBIndexer(this);
};
