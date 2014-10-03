var levelup = require('levelup');
var TreeDB = require('../');
var crypto = require('crypto');
var shasum = crypto.createHash('sha256');
var rimraf = require('rimraf');

function testStore() {
  console.log('store test.');
  newDb = levelup('./.tdb');
  var tree = new TreeDB(newDb);
  db = tree.db;
  var post = {
    title: 'testing',
    body: 'lorem ipsum blah blah blah blah.',
    created_at: Date.now()
  };
  console.log(post);
  tree.store('post', post, function(err, key) {
    console.log(key);
    teardown();
  });
};

function teardown() {
  rimraf('./.tdb', function(error){
    console.log('removed ./.tdb.');
  });
};

testStore();

