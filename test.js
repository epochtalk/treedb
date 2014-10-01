var levelup = require('levelup');
var TreeDB = require('./index');

newDb = levelup('./.tdb');
var tree = new TreeDB(newDb);
db = tree.db;
db.put(['node', 1234], 'LevelUP', function (err) {
  if (err) return console.log(err);
  db.get(['node', 1234], function (err, value) {
    if (err) return console.log(err);
    console.log('name=' + value);
  });
});

var ops = [
  { type: 'put', key: ['node', 2000], value: 'Yuri Irsenovich Kim' },
  { type: 'put', key: ['node', 2010], value: '16 February 1941' },
  { type: 'put', key: ['node', 2020], value: 'Kim Young-sook' },
  { type: 'put', key: ['node', 2030], value: 'Clown' }
];

db.batch(ops, function (err) {
  if (err) return console.log('Ooops!', err)
  console.log('Great success dear leader!');
  tree.nodes(null).on('data', console.log);
});
