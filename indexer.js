module.exports = TreeDBIndexer;
var trigger = require('level-trigger');
var async = require('async');

function TreeDBIndexer(db) {
  if (!(this instanceof TreeDBIndexer)) return new TreeDBIndexer(db);
  this.indexes = db.sublevel('indexes');
  this.indexed = db.sublevel('indexed');
  this.meta = db.sublevel('meta');
  var self = this;
  trigger(db, 'content-trigger', function (ch) {
    if (ch.type === 'put') self.putIndexes(ch);
    else if (ch.type === 'del') self.delIndexes(ch.key);
    return ch.key;
  },
  function (value, done) {
    done();
  });
};

TreeDBIndexer.prototype.addIndex = function(type, field, cb) {
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var key = ['pri', type, field];
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) {
    self.indexes.batch(rows, cb);
  });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, key);
    });
  };
};

TreeDBIndexer.prototype.addSecondaryIndex = function(type, parentType, field, cb) {
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var key = ['sec', type, parentType, field];
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) {
    self.indexes.batch(rows, cb);
  });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, key);
    });
  };
};

TreeDBIndexer.prototype.delIndexes = function(key) {
  // console.log('del indexes');
};

TreeDBIndexer.prototype.putIndexes = function(ch, cb) {
  var self = this;
  var rows = [];
  var metaRows = [];
  var storeRequests = [];
  var key = ch.key;
  var id = key[1];
  var val = ch.value;
  var indexStream = this.indexesOf(key);
  if (indexStream) {
    indexStream.on('data', function(index) {
      var indexedField = index.key[index.key.length - 1];
      var indexedKey = index.key.concat([val[indexedField], id]);
      console.log(indexedKey);
      // ['pri', 'board', 'created_at', 1381891311050, '-y_Jrwa1B']
      var row = {type: 'put', key: indexedKey, value: key};
      // var metaKey;
      // if (ch.key.length === 2) {
      //   metaKey = ['meta', ch.key[0], 'count'
      rows.push(row);
    })
    .on('end', function() {
      self.indexed.batch(rows, function(err) {
        if (cb) return cb();
      });
    });
  }
  else {
    if (cb) return cb(new Error('No indexes'));
  }
};

TreeDBIndexer.prototype.indexesOf = function(key) {
  var type = key[0];
  var q = {gt: ['pri', type, null], lt: ['pri', type, undefined]};
  // example: [ 'pri', 'board', 'created_at' ]
  return this.indexes.createReadStream(q);
  //   var query = {
  //     gt: ['sec', type, parentType, null],
  //     lt: ['sec', type, parentType, undefined]
  //   }
}

function noop(){};

