var path = require('path');
var levelup = require('levelup');
var TreeDB = require(path.join(__dirname, '..'));
var async = require('async');
var helper = require(path.join(__dirname, 'helper'));

var newDb = levelup(path.join(__dirname, '.tdb'));
var tree = new TreeDB(newDb);
var db = tree.db;

function testIndexes() {
  console.log('test indexes.');
  
}

testIndexes();

