module.exports = TreeDB;
var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');
var async = require('async');
var through2 = require('through2');
var TreeDBIndexer = require(path.join(__dirname, 'indexer'));
var TreeDBMeta = require(path.join(__dirname, 'meta'));
var keys = require(path.join(__dirname, 'keys'));

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
  this.branches = this.db.sublevel('branches');
  this.roots = this.db.sublevel('roots');
  this.indexes = this.db.sublevel('indexes');
  this.indexed = this.db.sublevel('indexed');
  this.meta = this.db.sublevel('meta');
  this.indexer = new TreeDBIndexer(this);
  this.metaTreedb = new TreeDBMeta(this, opts.meta);
};

// options: object, type, parentKey, callback
TreeDB.prototype.store = function(options) {
  var object = options.object;
  var type = options.type;
  var parentKey = options.parentKey || false;
  var callback = options.callback || noop;
  var self = this;
  var rows = [];
  var cRels = [];
  var pRels = [];
  var key = [type, keys.hash()];
  rows.push({type: 'put', key: key, value: object});
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
      callback(err, {key: key, value: object});
    });
  };
};

TreeDB.prototype.get = function(key, cb) {
  if (!cb) cb = noop;
  this.db.get(key, function(err, value) {
    return cb(err, {key: key, value: value});
  });
};

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

// options:  key, field, callback
TreeDB.prototype.metadata = function(options) {
  this.metaTreedb.get(options);
};

function noop(){};

