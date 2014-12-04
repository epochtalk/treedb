module.exports = TreeDB;
var path = require('path');
var sublevel = require('level-sublevel/bytewise');
var bytewise = require('bytewise');
var readonly = require('read-only-stream');
var defined = require('defined');
var async = require('async');
var through2 = require('through2');
var Indexer = require(path.join(__dirname, 'indexer'));
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
  this.indexer = new Indexer(this);
};

// options: object, type, parentKeys, [callback]
TreeDB.prototype.store = function(opts, cb) {
  var self = this;
  var callback = cb || noop;
  var key = [opts.type, keys.hash()];
  opts.key = key;
  var dbRows = [], cRows = [], pRows = [], storeRequests = [];
  dbRows.push({type: 'put', key: key, value: opts.object});
  if (opts.parentKeys) {
    opts.parentKeys.forEach(function(parentKey) {
      cRows.push({type: 'put', key: parentKey.concat(key), value: 0});
      pRows.push({type: 'put', key: key.concat(parentKey), value: 0});
    });
    storeRequests.push(function(cb) { self.branches.batch(cRows, cb); });
    storeRequests.push(function(cb) { self.roots.batch(cRows, cb); });
  }
  storeRequests.push(function(cb) { self.db.batch(dbRows, cb); });
  self.indexer.storeIndexes(opts, commit);
  function commit() {
    async.parallel(storeRequests, function(err) {
      callback({err: err, key: key, value: opts.object});
    });
  };
};

TreeDB.prototype.get = function(key, cb) {
  if (!cb) cb = noop;
  this.db.get(key, function(err, value) {
    return cb(err, {key: key, value: value});
  });
};

// options: type, limit, (indexedField, (indexedValue))
// returns stream
TreeDB.prototype.nodes = function(options) {
  var self = this;
  var type = options.type;
  var query;
  if (options && options.indexedField) {
    var queryPrefix = ['pri', type, options.indexedField];
    if (options.indexedValue) {
      queryPrefix = queryPrefix.concat(options.indexedValue);
    }
    query = {
      limit: options.limit || undefined,
      gt: queryPrefix.concat(null),
      lt: queryPrefix.concat(undefined)
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

// options: parentKey, type, indexedField, limit, reverse
// returns stream
TreeDB.prototype.children = function(options) {
  var parentKey = options.parentKey;
  var type = options.type;
  var indexedField = options.indexedField;
  var self = this;
  var parentType = parentKey[0];
  var parentId = parentKey[1];
  var query;
  if (indexedField) {
    var queryKey = ['sec', type, parentKey[0], parentKey[1], indexedField];
    query = {
      limit: options.limit || undefined,
      reverse: options.reverse || false,
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
      limit: options.limit || undefined,
      reverse: options.reverse || false,
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

// options: key, parentType, limit
// returns stream
TreeDB.prototype.parents = function(options) {
  var self = this;
  var queryPrefix = [options.key];
  if (options.parentType) {
    queryPrefix = queryPrefix.concat(options.parentType);
  }
  var query = {
    limit: options.limit || undefined,
    gt: queryPrefix.concat(null),
    lt: queryPrefix.concat(undefined)
  };
  return readonly(self.roots.createReadStream(query)
  .pipe(through2.obj(function(ch, enc, cb) {
    var self2 = this;
    var dbKey = [ch.key[2], ch.key[3]];
    self.db.get(dbKey, function(err, val) {
      if (err) throw err;
      self2.push({key: dbKey, value: val});
      cb();
    });
  })));
};

// options: {indexes}
TreeDB.prototype.addIndexes = function(indexes, cb) {
  var self = this;
  var callback = cb || noop;
  async.each(indexes, function(index, cb) {
    self.indexer.addIndex(index, cb);
  }, callback);
};

// options:  key, field
TreeDB.prototype.metadata = function(options, cb) {
  this.metaTreedb.get(options, cb);
};

function noop(){};

