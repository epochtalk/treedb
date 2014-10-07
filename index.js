module.exports = TreeDB;
var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');
var async = require('async');
var indexTrigger = require(path.join(__dirname, 'index-trigger'));
var keys = require(path.join(__dirname, 'keys'));

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
  this.tree = this.db.sublevel('tree');
  this.indexes = this.db.sublevel('indexes');
  this.indexTrigger = indexTrigger(this.db);
};

TreeDB.prototype.store = function(obj, parentKey, cb) {
  if (typeof parentKey === 'function') {
    cb = parentKey;
    parentKey = false;
  }
  if (!parentKey || typeof parentKey !== 'object') parentKey = false;
  var self = this;
  var rows = [];
  var rels = [];
  var hash = keys.hash();
  var key = [obj.type, hash];
  rows.push({type: 'put', key: key, value: obj});

  var storeRequests = [];
  if (parentKey) {
    // assumes parent already has been saved in the database
    rels.push({type: 'put', key: parentKey.concat(key), value: 0});
    storeRequests.push(function(cb) {
      self.tree.batch(rels, cb);
    });
  }

  storeRequests.push(function(cb) {
    self.db.batch(rows, cb);
  });

  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, key);
    });
  };
};

TreeDB.prototype.nodes = function(type, opts) {
  var query = {
    gte: [type, null],
    lt: [type, undefined]
  };
  return readonly(this.db.createReadStream(query));
};

TreeDB.prototype.children = function(key, opts) {
  var query = {
    gte: key.concat(null),
    lt: key.concat(undefined)
  };
  return readonly(this.tree.createReadStream(query));
};

TreeDB.prototype.addIndex = function(type, field, cb) {
  var self = this;
  var rows = [];
  var key = [type, 'index', field];
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) {
    self.db.batch(rows, cb);
  });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, key);
    });
  };
}

TreeDB.prototype.addSecondaryIndex = function(type, parentType, field, cb) {
  var self = this;
  var rows = [];
  var key = ['secondary', type, parentType, 'index', field];
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) {
    self.db.batch(rows, cb);
  });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, key);
    });
  };
}
