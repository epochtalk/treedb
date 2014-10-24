var path = require('path');
var readonly = require('read-only-stream');
var defined = require('defined');
var async = require('async');
var through2 = require('through2');
var keys = require(path.join(__dirname, 'keys'));

TreeDB.prototype.store = function(obj, parentKey, cb) {
  if (typeof parentKey === 'function') {
    cb = parentKey;
    parentKey = false;
  }
  if (!parentKey || typeof parentKey !== 'object') parentKey = false;
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var cRels = [];
  var pRels = [];
  var key = [obj.type, keys.hash()];
  rows.push({type: 'put', key: key, value: obj});
  var storeRequests = [];
  if (parentKey) {
    // assumes parent already has been saved in the database
    cRels.push({type: 'put', key: parentKey.concat(key), value: 0});
    pRels.push({type: 'put', key: key.concat(parentKey), value: 0});
    storeRequests.push(function(cb) { self.branches.batch(cRels, cb); });
    storeRequests.push(function(cb) { self.roots.batch(pRels, cb); });
  }
  storeRequests.push(function(cb) {
    self.db.batch(rows, cb);
  });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, {key: key, value: obj});
    });
  };
};

TreeDB.prototype.get = function(key, cb) {
  if (!cb) cb = noop;
  this.db.get(key, function(err, value) {
    return cb(err, {key: key, value: value});
  });
};
var TreeDB = require(path.join(__dirname, 'treedb'));

TreeDB.prototype.nodes = function(type, opts) {
  var self = this;
  var query;
  if (opts && opts.indexedField) {
    query = {
      gt: ['pri', type, opts.indexedField, null],
      lt: ['pri', type, opts.indexedField, undefined]
    };
    return readonly(self.indexed.createReadStream(query)
    .pipe(through2.obj(function(ch, enc, cb) {
      var self2 = this;
      var dbKey = [ch.key[1], ch.key[ch.key.length - 1]];
      self.db.get(dbKey, function(err, val) {
        if (err) throw err;
        self2.push({key: dbKey, value: val});
        cb();
      });
    })));
  }
  else {
    query = {
      gt: [type, null],
      lt: [type, undefined]
    };
    return readonly(self.db.createReadStream(query));
  }
};

TreeDB.prototype.children = function(parentKey, type, opts) {
  var self = this;
  var parentType = parentKey[0];
  var parentId = parentKey[1];
  var query;
  if (opts && opts.indexedField) {
    var queryKey = ['sec', type, parentKey[0], parentKey[1], opts.indexedField];
    query = {
      gt: queryKey.concat(null),
      lt: queryKey.concat(undefined)
    };
    return readonly(self.indexed.createReadStream(query)
    .pipe(through2.obj(function(ch, enc, cb) {
      var self2 = this;
      // ch is index key/value
      var dbKey = [ch.key[1], ch.key[ch.key.length - 1]];
      self.db.get(dbKey, function(err, val) {
        if (err) throw err;
        self2.push({key: dbKey, value: val});
        cb();
      });
    })));
  }
  else {
    query = {
      gt: parentKey.concat([type, null]),
      lt: parentKey.concat([type, undefined])
    };
    return readonly(self.branches.createReadStream(query)
    .pipe(through2.obj(function(ch, enc, cb) {
      var self2 = this;
      var dbKey = [ch.key[2], ch.key[3]];
      self.db.get(dbKey, function(err, val) {
        if (err) throw err;
        self2.push({key: dbKey, value: val});
        cb();
      });
    })));
  }
};

TreeDB.prototype.addIndex = function(type, field, cb) {
  this.indexer.addIndex(type, field, cb);
};

TreeDB.prototype.addSecondaryIndex = function(type, parentType, field, cb) {
  this.indexer.addSecondaryIndex(type, parentType, field, cb);
};

TreeDB.prototype.metadata = function(meta, type, sortField, parentKey, cb) {
  this.indexer.metadata(meta, type, sortField, parentKey, cb);
};

function noop(){};

module.exports = TreeDB;
