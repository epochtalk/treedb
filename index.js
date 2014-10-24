var path = require('path');
var readonly = require('read-only-stream');
var defined = require('defined');
var through2 = require('through2');
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

module.exports = TreeDB;
