module.exports = TreeDB;
var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');
var async = require('async');
var through2 = require('through2');
var TreeDBIndexer = require(path.join(__dirname, 'indexer'));
var keys = require(path.join(__dirname, 'keys'));

function TreeDB(db, opts) {
  if (!(this instanceof TreeDB)) return new TreeDB(db, opts);
  if (!opts) opts = {};
  this.db = sublevel(db, {keyEncoding: bytewise, valueEncoding: 'json'});
  this.tree = this.db.sublevel('tree');
  this.indexes = this.db.sublevel('indexes');
  this.indexed = this.db.sublevel('indexed');
  this.indexer = new TreeDBIndexer(this.db);
};

TreeDB.prototype.store = function(obj, parentKey, cb) {
  if (typeof parentKey === 'function') {
    cb = parentKey;
    parentKey = false;
  }
  if (!parentKey || typeof parentKey !== 'object') parentKey = false;
  if (!cb) cb = noop;

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
      cb(err, {key: key, value: obj});
    });
  };
};

TreeDB.prototype.get = function(key, cb) {
  if (!cb) cb = noop;
  this.db.get(key, cb);
};

TreeDB.prototype.nodes = function(type, opts) {
  var self = this;
  var query;
  if (opts && opts.indexedField) {
    query = {
      gt: ['pri', type, opts.indexedField, null],
      lt: ['pri', type, opts.indexedField, undefined]
    };
    return self.indexed.createReadStream(query)
    .pipe(through2.obj(function(ch, enc, cb) {
      var self2 = this;
      // ch is index key/value
      var dbKey = ch.value;
      self.db.get(dbKey, function(err, val) {
        if (err) throw err;
        self2.push(val);
        cb();
      });
    }));
  }
  else {
    query = {
      gt: [type, null],
      lt: [type, undefined]
    };
    return readonly(self.db.createReadStream(query));
  }
};

TreeDB.prototype.children = function(key, opts) {
  var self = this;
  var query = {
    gt: key.concat(null),
    lt: key.concat(undefined)
  };
  return self.tree.createReadStream(query)
  .pipe(through2.obj(function(ch, enc, cb) {
    var self2 = this;
    var dbKey = [ch.key[2], ch.key[3]];
    self.db.get(dbKey, function(err, val) {
      if (err) throw err;
      self2.push({key: dbKey, value: val});
      cb();
    });
  }));
};

TreeDB.prototype.addIndex = function(type, field, cb) {
  this.indexer.addIndex(type, field, cb);
};

TreeDB.prototype.addSecondaryIndex = function(type, parentType, field, cb) {
  this.indexer.addSecondaryIndex(type, parentType, field, cb);
};

function noop(){};

