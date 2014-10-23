module.exports = TreeDBIndexer;
var trigger = require('level-trigger');
var async = require('async');

function TreeDBIndexer(tree) {
  if (!(this instanceof TreeDBIndexer)) return new TreeDBIndexer(tree);
  var self = this;
  self.tree = tree;
  trigger(tree.db, 'content-trigger', function (ch) {
    var key = ch.key;
    if (ch.type === 'put') {
      var q = {gt: key.concat(null), lt: key.concat(undefined), limit: 1};
      var parentKey = null;
      self.tree.roots.createReadStream(q).on('data', function(ch) {
        parentKey = [ch.key[2], ch.key[3]];
      }).on('end', function() {
        self.putIndexes(ch, parentKey);
      });
    }
    else if (ch.type === 'del') self.delIndexes(ch.key);
    return ch.key;
  },
  function (value, done) { done(); });
};

TreeDBIndexer.prototype.addIndex = function(type, field, cb) {
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var key = ['pri', type, field];
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) { self.tree.indexes.batch(rows, cb); });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) { cb(err, key); });
  };
};

TreeDBIndexer.prototype.addSecondaryIndex = function(type, parentType, field, cb) {
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var key = ['sec', type, parentType, field];
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) { self.tree.indexes.batch(rows, cb); });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) { cb(err, key); });
  };
};

TreeDBIndexer.prototype.delIndexes = function(key) {
  // console.log('del indexes');
};

TreeDBIndexer.prototype.putIndexes = function(ch, parentKey, cb) {
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var metaRows = [];
  var storeRequests = [];
  var key = ch.key;
  var type = ch.key[0];
  var val = ch.value;
  var id = key[1];
  self.indexesOf(key, function(err, indexes) {
    indexes.forEach(function(index) {
      // gets all primary/secondary indexes
      var indexedField = index.key[index.key.length - 1];
      var indexedKey = index.key.concat([val[indexedField], id]);
      if (index.key[0] === 'sec') {
        indexedKey = index.key.concat([val[indexedField], id]);
        indexedKey.splice(3, 0, parentKey[1]);
      }
      // ['pri', 'board', 'created_at', 1381891311050, '-y_Jrwa1B']
      // ['sec', 'thread', 'board', 'Wk-hvQmvHr', 'updated_at', 1415323275770,
      // 'ZJc6RZ48Hr']
      var row = {type: 'put', key: indexedKey, value: 0};
      rows.push(row);
    });

    storeRequests.push(function(cb) { self.tree.indexed.batch(rows, cb); });
    commit();
  });
  function commit() {
    async.parallel(storeRequests, function(err) { cb(err, key); });
  };
};

TreeDBIndexer.prototype.indexQuery = function(q, cb) {
  var indexStream = this.tree.indexes.createReadStream(q);
  var indexes = [];
  indexStream.on('data', function(index) {
    indexes.push(index);
  })
  .on('end', function() {
    cb(null, indexes);
  });
};


TreeDBIndexer.prototype.indexesOf = function(key, cb) {
  var self = this;
  var type = key[0];
  var priQuery = {gt: ['pri', type, null], lt: ['pri', type, undefined]};
  var secQuery = {gt: ['sec', type, null], lt: ['sec', type, undefined]};
  // example: [ 'pri', 'board', 'created_at' ]
  async.parallel([
    function(cb) { self.indexQuery(priQuery, cb); },
    function(cb) { self.indexQuery(secQuery, cb); }
  ], function(err, results) {
    var indexes = results[0].concat(results[1]);
    return cb(err, indexes);
  });
};

function noop(){};

