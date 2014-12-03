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
      var q = {gt: key.concat(null), lt: key.concat(undefined)};
      var parentKeys = [];
      self.tree.roots.createReadStream(q).on('data', function(ch) {
        parentKeys.push([ch.key[2], ch.key[3]]);
      }).on('end', function() {
        if (parentKeys.length > 0) {
          parentKeys.forEach(function(parentKey) {
            self.putIndexes(ch, parentKey);
          });
        }
        else {
          self.putIndexes(ch, null);
        }
      });
    }
    else if (ch.type === 'del') self.delIndexes(ch.key);
    return ch.key;
  },
  function (value, done) { done(); });
};

// options: {type, parentType, field, callback}
TreeDBIndexer.prototype.addIndex = function(options) {
  var type = options.type;
  var parentType = options.parentType || false;
  var agnostic = options.agnostic || false;
  var field = options.field;
  var callback = options.callback || noop;

  var self = this;
  var rows = [];
  var key = ['pri', type, field];
  if (parentType) {
    key = ['sec', type, parentType, field];
  }
  else if (agnostic) {
    key = ['ter', type, field];
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
      var indexedField = index.key[index.key.length - 1].split('.');
      var indexedValue = getIndexedValue(indexedField, val);
      if (indexedValue) {
        var indexedKey = index.key.concat([indexedValue, id]);
        if (index.key[0] === 'sec') {
          indexedKey.splice(3, 0, parentKey[1]);
        }
        // ['pri', 'board', 'created_at', 1381891311050, '-y_Jrwa1B']
        // ['sec', 'thread', 'board', 'Wk-hvQmvHr', 'updated_at', 1415323275770,
        // 'ZJc6RZ48Hr']
        var row = {type: 'put', key: indexedKey, value: 0};
        rows.push(row);
      }
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
  var terQuery = {gt: ['ter', type, null], lt: ['ter', type, undefined]};
  // example: [ 'pri', 'board', 'created_at' ]
  async.parallel([
    function(cb) { self.indexQuery(priQuery, cb); },
    function(cb) { self.indexQuery(secQuery, cb); },
    function(cb) { self.indexQuery(terQuery, cb); }
  ], function(err, results) {
    var indexes = results[0].concat(results[1], results[2]);
    return cb(err, indexes);
  });
};

function noop(){};

function getIndexedValue(arr, obj) {
  var result = obj;
  var successful = arr.every(function(field, index, array){
    if (arr[0] === 'smf') {
    }
    if (result[field]) {
      result = result[field];
      return true;
    }
    else {
      return false;
    }
  });
  if (successful) {
    return result;
  }
};
