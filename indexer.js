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
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var metaRows = [];
  var storeRequests = [];
  var key = ch.key;
  var id = key[1];
  var val = ch.value;
  self.indexesOf(key, function(err, indexes) {
    indexes.forEach(function(index) {
      var indexedField = index.key[index.key.length - 1];
      var indexedKey = index.key.concat([val[indexedField], id]);
      // ['pri', 'board', 'created_at', 1381891311050, '-y_Jrwa1B']
      var row = {type: 'put', key: indexedKey, value: key};
      // var metaKey;
      // if (ch.key.length === 2) {
      //   metaKey = ['meta', ch.key[0], 'count'
      rows.push(row);
    });
    self.indexed.batch(rows, cb);
  });
};

TreeDBIndexer.prototype.indexQuery = function(q, cb) {
  var indexStream = this.indexes.createReadStream(q);
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

