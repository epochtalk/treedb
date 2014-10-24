var path = require('path');
var defined = require('defined');
var TreeDB = require(path.join(__dirname, 'treedb'));
require(path.join(__dirname, 'store'));
require(path.join(__dirname, 'get'));
require(path.join(__dirname, 'nodes'));
require(path.join(__dirname, 'children'));
require(path.join(__dirname, 'add-index'));
require(path.join(__dirname, 'add-secondary-index'));
require(path.join(__dirname, 'metadata'));

module.exports = TreeDB;
