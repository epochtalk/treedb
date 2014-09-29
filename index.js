module.exports = Epochbase;

var levelup = require('levelup');
var sublevel = require('level-sublevel');
var mappedIndex = require('level-mapped-index');

function noop() {};

function Epochbase(path, opts) {
  var self = this;
  if (!(this instanceof Epochbase)) return new Epochbase(path, opts);

  var db = levelup(path);
  db = sublevel(db);
  db = mappedIndex(db);

  self._db = db;
};


var e = new Epochbase('./.edb');
db = e._db;
db.put('name', 'LevelUP', function (err) {
  if (err) return console.log(err);
  db.get('name', function (err, value) {
    if (err) return console.log(err);
    console.log('name=' + value);
  });
});

