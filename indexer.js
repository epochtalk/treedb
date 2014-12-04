module.exports = TreeDBIndexer;
var path = require('path');
var async = require('async');
var keys = require(path.join(__dirname, 'keys'));

function TreeDBIndexer(tree) {
  if (!(this instanceof TreeDBIndexer)) return new TreeDBIndexer(tree);
  var self = this;
  self.tree = tree;
};

TreeDBIndexer.prototype.storeIndexes = function(opts, cb) {
  var self = this;
  var storeRequests = [], parentKeys = [];
  var key = opts.key, value = opts.object;
  var rootsQuery = {gt: key.concat(null), lt: key.concat(undefined)};
  self.tree.roots.createReadStream(rootsQuery).on('data', function(ch) {
    parentKeys.push([ch.key[2], ch.key[3]]);
  }).on('end', function() {
    if (parentKeys.length > 0) {
      parentKeys.forEach(function(parentKey) {
        storeRequests.push(function(cb) {
          self.putIndexes({key: key, value: value}, parentKey, cb);
        });
      });
    }
    else {
      storeRequests.push(function(cb) {
        self.putIndexes({key: key, value: value}, null, cb);
      });
    }
    async.parallel(storeRequests, cb);
  });
}
// options: {type, parentType, field, callback}
TreeDBIndexer.prototype.addIndex = function(options, cb) {
  var type = options.type;
  var parentType = options.parentType || false;
  var field = options.field;
  var callback = cb || noop;

  var self = this;
  var rows = [];
  var key = ['pri', type, field];
  if (parentType) {
    key = ['sec', type, parentType, field];
  }
  rows.push({type: 'put', key: key, value: 0});
  var storeRequests = [];
  storeRequests.push(function(cb) { self.tree.indexes.batch(rows, cb); });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) { callback(err, key); });
  };
};

TreeDBIndexer.prototype.delIndexes = function(key) {
  // console.log('del indexes');
};

TreeDBIndexer.prototype.putIndexes = function(ch, parentKey, cb) {
  console.log('parentKey');
  console.log(parentKey);
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
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

