var path = require('path');
var levelup = require('levelup');
var TreeDB = require(path.join(__dirname, '..'));
var crypto = require('crypto');
var shasum = crypto.createHash('sha256');
var rimraf = require('rimraf');

function testCreate() {
  console.log('creation test.');
  newDb = levelup(path.join(__dirname, '.tdb'));
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
    rimraf(path.join(__dirname, '.tdb'), function(error){
      console.log('removed ./.tdb.');
      // testHash();
    });
  });
};

testCreate();
