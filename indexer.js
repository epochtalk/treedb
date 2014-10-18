module.exports = TreeDBIndexer;
var trigger = require('level-trigger');
var async = require('async');

function TreeDBIndexer(treeDB) {
  if (!(this instanceof TreeDBIndexer)) return new TreeDBIndexer(treeDB);
  this.indexesDB = treeDB.sublevel('indexes');
  this.indexedDB = treeDB.sublevel('indexed');
  var self = this;
  var trig = trigger(treeDB, 'index-trigger', function (ch) {
    if (ch.type === 'put') {
      self.putIndexes(ch);
    }
    else if (ch.type === 'del') {
      self.delIndexes(ch.key);
    }
    return ch.key;
  },
  function (value, done) {
    // call done when job is done.
    // fix for callback of put index
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
    self.indexesDB.batch(rows, cb);
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
    self.indexesDB.batch(rows, cb);
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
  var storeRequests = [];
  var dataKey = ch.key;
  var dataValue = ch.value;
  var indexStream = this.indexesOf(dataKey);
  if (indexStream) {
    indexStream.on('data', function(ch) {
      var indexKey = ch.key;
      var indexedField = indexKey[2];
      var dataKeyId = dataKey[1];
      var indexedKey = indexKey.concat([dataValue[indexedField], dataKeyId]);
      // example indexedKey
      // ['pri', 'board', 'index', 'created_at', 1381891311050, '-y_Jrwa1B']
      var row = {type: 'put', key: indexedKey, value: dataKey};
      rows.push(row);
    })
    .on('end', function() {
      self.indexedDB.batch(rows, function(err) {
        if (cb) return cb();
      });
    });
  }
  else {
    if (cb) return cb(new Error('No indexes'));
  }
};

TreeDBIndexer.prototype.indexesOf = function(key) {
  var self = this;
  var readStream = null;
  if (key.length === 2) {
    var type = key[0];
    // find indexes defined
    var query = {
      gt: ['pri', type, null],
      lt: ['pri', type, undefined]
    };
    readStream = self.indexesDB.createReadStream(query);
  }
  else if (key.length === 4) {
    // nothing yet
    var type = key[0];
    var parentType = key[1];
    var query = {
      gt: ['sec', type, parentType, null],
      lt: ['sec', type, parentType, undefined]
    }
    readStream = self.indexesDB.createReadStream(query);
  }
  return readStream;
}

function noop(){};

