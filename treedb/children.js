var path = require('path');
var readonly = require('read-only-stream');
var through2 = require('through2');
var TreeDB = require(path.join(__dirname, 'treedb'));

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

