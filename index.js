module.exports = TreeDB;
var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');
var async = require('async');
var keys = require(path.join(__dirname, 'keys'));

function noop() {};

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
  this.tree = this.db.sublevel('tree');
  this.types = [];
};

TreeDB.prototype.nodes = function(key) {
  var query = {
    gte: [ 'node', defined(key, null)],
    lt: [ 'node', undefined]
  };
  return readonly(this.db.createReadStream(query));
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
  var query = {
    gt: ['type', null],
    lt: ['type', undefined]
  };
  return self.db.createReadStream(query);
};

TreeDB.prototype.store = function(obj, parentKey, cb) {
  if (typeof parentKey === 'function') {
    cb = parentKey;
    parentKey = false;
  }
  if (!parentKey || typeof parentKey !== 'array') parentKey = false;

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
      self.tree.batch(rels, function(err) {
        console.log('stored rels');
        return cb(err);
      });
    });
  }

  storeRequests.push(function(cb) {
    self.db.batch(rows, function(err) {
      return cb(err);
    });
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
    gte: ['tree', defined(key, null)],
    lt: ['tree', undefined]
  };
  return readonly(this.tree.createReadStream(query));
};

