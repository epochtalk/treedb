var levelup = require('levelup');
var TreeDB = require('../');
var async = require('async');
var path = require('path');
var helper = require(path.join(__dirname, 'helper'));

var newDb = levelup('./.tdb');
var tree = new TreeDB(newDb);
var db = tree.db;

function testIndexes() {
  console.log('test indexes.');
  
}

testIndexes();

