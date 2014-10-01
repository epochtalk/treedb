module.exports = TreeDB;

var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');

function noop() {};

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
};


TreeDB.prototype.nodes = function(key) {
  var opts = {
    gt: [ 'node', defined(key, null)],
    lt: [ 'node', undefined]
  };
  return readonly(this.db.createReadStream(opts));
};
