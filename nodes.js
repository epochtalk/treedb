var path = require('path');
var readonly = require('read-only-stream');
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

