var levelup = require('levelup');
var TreeDB = require('../');
var crypto = require('crypto');
var shasum = crypto.createHash('sha256');
var keys = require('../keys');

function testHash() {
  console.log('random keys');
  for (var i = 0; i < 10; i++) {
    console.log(keys.hash());
  }
}

testHash();
