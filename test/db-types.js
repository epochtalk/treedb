var levelup = require('levelup');
var TreeDB = require('../');
var crypto = require('crypto');
var shasum = crypto.createHash('sha256');
var rimraf = require('rimraf');

function testTypes() {
  console.log('types test.');
  newDb = levelup('./.tdb');
  var tree = new TreeDB(newDb);
  tree.registerType('board', {}, function(err, key) {
    console.log(key);
    tree.registerType('thread', {}, function(err, key) {
      console.log(key);
      tree.registerType('post', {}, function(err, key) {
        console.log(key);
        tree.getTypes().on('data', console.log);
        rimraf('./.tdb', function(error){
          console.log('removed ./.tdb.');
        });
      });
    });
  });
};

testTypes();
