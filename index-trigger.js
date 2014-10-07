var trigger = require('level-trigger');

var indexes;

module.exports = function(db) {
  indexes = db.sublevel('indexes');
  var trig = trigger(db, 'index-trigger', function (ch) {
    if (ch.type === 'put') {
      putIndexes(ch.key);
    }
    else if (ch.type === 'del') {
      delIndexes(ch.key);
    }
    return ch.key;
  },
  function (value, done) {
    console.log('value');
    console.log(value);
    //call done when job is done.
    done();
  });
  return trig;
};

function delIndexes(key) {
  console.log('del indexes');
};

function putIndexes(key, cb) {
  if (key.length === 2) {
    var type = key[0];
    var hash = key[1];
    // find indexes defined
    var query = {
      gt: ['pri', type, 'index', null],
      lt: ['pri', type, 'index', undefined]
    };
    indexes.createReadStream(query)
    .on('data', function(index) {
      console.log('index');
      console.log(index);
    })
    .on('end', function() {
    });
  }
  console.log('put indexes');
  console.log(key);
};

