module.exports = TreeDBIndexer;
var trigger = require('level-trigger');

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
  return trig;
};

TreeDBIndexer.prototype.delIndexes = function(key) {
  console.log('del indexes');
};

TreeDBIndexer.prototype.putIndexes = function(ch, cb) {
  var self = this;
  var rows = [];
  var storeRequests = [];
  var dataKey = ch.key;
  var dataValue = ch.value;
  this.indexesOf(dataKey)
  .on('data', function(ch) {
    var indexKey = ch.key;
    var indexedField = indexKey[3];
    var indexedKey = indexKey.concat(dataValue[indexedField]);
    rows.push({type: 'put', key: indexedKey, value: dataKey});
  })
  .on('end', function() {
    self.indexedDB.batch(rows, function(err) {
      console.log('batched indexes in indexedDB.');
      console.log(rows);
      if (cb) return cb();
    });
  });
};

TreeDBIndexer.prototype.indexesOf = function(key) {
  var self = this;
  if (key.length === 2) {
    var type = key[0];
    var hash = key[1];
    // find indexes defined
    var query = {
      gt: ['pri', type, 'index', null],
      lt: ['pri', type, 'index', undefined]
    };
    return self.indexesDB.createReadStream(query);
  }
  else if (key.length === 4) {
    // nothing yet
    return null;
  }
}

