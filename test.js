var levelup = require('levelup');
var TreeDB = require('./index');

newDb = levelup('./.tdb');
var tree = new TreeDB(newDb);
db = tree.db;
db.put('testkey', 'LevelUP', function (err) {
  if (err) return console.log(err);
  db.get('testkey', function (err, value) {
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
  tree.nodes(2000).on('data', console.log);
});

tree.registerType('board', {}, function(err, key) {
  console.log(key);
  tree.registerType('thread', {}, function(err, key) {
    console.log(key);
    tree.registerType('post', {}, function(err, key) {
      console.log(key);
    });
  });
});

