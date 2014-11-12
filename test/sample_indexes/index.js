var path = require('path');
var boardIndexes = require(path.join(__dirname, 'boards'));
var threadIndexes = require(path.join(__dirname, 'threads'));
module.exports = [boardIndexes, threadIndexes];
