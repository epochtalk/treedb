module.exports = TreeDB;
var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');
var keys = require(path.join(__dirname, 'keys'));

function noop() {};

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
  this.types = [];
};


TreeDB.prototype.nodes = function(key) {
  var opts = {
    gte: [ 'node', defined(key, null)],
    lt: [ 'node', undefined]
  };
  return readonly(this.db.createReadStream(opts));
};

TreeDB.prototype.registerType = function(name, opts, cb) {
  var self = this;
  var rows = [];
  var typeKey = ['type', name];

  rows.push({type: 'put', key: typeKey, value: 0});
  commit();
  function commit() {
    self.db.batch(rows, function(err) {
      cb(err, typeKey);
    });
  };
};

TreeDB.prototype.getTypes = function() {
  var self = this;
  var opts = {
    gt: ['type', null],
    lt: ['type', undefined]
  };
  return self.db.createReadStream(opts);
};

TreeDB.prototype.store = function(type, obj, cb) {
  var self = this;
  var rows = [];
  var hash = keys.hash();
  var key = [type, hash];
  rows.push({type: 'put', key: key, value: obj});
  commit();
  function commit() {
    self.db.batch(rows, function(err) {
      cb(err, key);
    });
  };
};

