module.exports = TreeDB;

var sublevel = require('level-sublevel');
var bytewise = require('bytewise');

function noop() {};

function TreeDB(db, opts) {
  var self = this;
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  self._db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
};

