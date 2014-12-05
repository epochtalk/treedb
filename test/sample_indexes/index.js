var path = require('path');
var boardIndexes = require(path.join(__dirname, 'boards'));
var threadIndexes = require(path.join(__dirname, 'threads'));
var postIndexes = require(path.join(__dirname, 'posts'));
module.exports = [boardIndexes, threadIndexes, postIndexes];
