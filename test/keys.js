var levelup = require('levelup');
var TreeDB = require('../');
var crypto = require('crypto');
var shasum = crypto.createHash('sha256');
var keys = require('../keys');

function testHash() {
  console.log('random keys');
  console.log(keys.newHash());
  console.log(keys.newHash());
  console.log(keys.newHash());
}

testHash();
