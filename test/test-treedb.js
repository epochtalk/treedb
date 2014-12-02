var path = require('path');
var async = require('async');
var levelup = require('levelup');
var rimraf = require('rimraf');
var treedb = require(path.join(__dirname, '..'));
var db = new levelup(path.join('/', 'tmp', '.treedb'));
var tree = treedb(db, {meta: require(path.join(__dirname, 'meta'))});
// var tree = treedb(db);
tree.teardown = function() {
  var dbPath = path.join('/', 'tmp', '.treedb');
  rimraf(dbPath, function(error){
    console.log('teardown: removed ' + dbPath);
  });
}

module.exports = tree;
