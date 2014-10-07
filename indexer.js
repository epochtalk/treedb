var trigger = require('level-trigger');
var indexesDB; // list of indexes
var indexedDB; // indexed values
module.exports = function(db) {
  indexesDB = db.sublevel('indexes');
  indexedDB = db.sublevel('indexed');
  
  var trig = trigger(db, 'index-trigger', function (ch) {
    if (ch.type === 'put') {
      putIndexes(ch);
    }
    else if (ch.type === 'del') {
      delIndexes(ch.key);
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

function delIndexes(key) {
  console.log('del indexes');
};

function putIndexes(ch, cb) {
  var rows = [];
  var storeRequests = [];
  var dataKey = ch.key;
  var dataValue = ch.value;
  indexesOf(dataKey)
  .on('readable', function() {
    console.log('put indexes of ' + JSON.stringify(dataKey));
  })
  .on('data', function(ch) {
    var indexKey = ch.key;
    var indexedField = indexKey[3];
    var indexedKey = indexKey.concat(dataValue[indexedField]);
    console.log('indexedField: ' + indexedField);
    console.log(indexedKey);
    rows.push({type: 'put', key: indexedKey, value: dataKey});
  })
  .on('end', function() {
    indexedDB.batch(rows, function(err) {
      console.log('batched indexes in indexedDB.');
      console.log(rows);
      if (cb) return cb();
    });
  });
};

function indexesOf(key) {
  if (key.length === 2) {
    var type = key[0];
    var hash = key[1];
    // find indexes defined
    var query = {
      gt: ['pri', type, 'index', null],
      lt: ['pri', type, 'index', undefined]
    };
    return indexesDB.createReadStream(query);
  }
  else if (key.length === 4) {
    // nothing yet
    return null;
  }
}
