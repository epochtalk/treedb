var levelup = require('levelup');
var TreeDB = require('./index');

newDb = levelup('./.tdb');
var e = new TreeDB(newDb);
db = e._db;
db.put('name', 'LevelUP', function (err) {
  if (err) return console.log(err);
  db.get('name', function (err, value) {
    if (err) return console.log(err);
    console.log('name=' + value);
  });
});

