module.exports = TreeDB;

var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');

function noop() {};

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
};


TreeDB.prototype.nodes = function(key) {
  var opts = {
    gt: [ 'nodes', defined(key, null), null ],
    lt: [ 'nodes', key, undefined ]
  };
  return readonly(this.db.createReadStream(opts));
};
