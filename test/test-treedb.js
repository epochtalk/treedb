var path = require('path');
var async = require('async');
var levelup = require('levelup');
var treedb = require(path.join(__dirname, '..'));
var db = new levelup(path.join('/', 'tmp', '.treedb'));
var tree = treedb(db);

module.exports = tree;

