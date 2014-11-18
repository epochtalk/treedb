var path = require('path');
var Controllers = module.exports = {};
Controllers.board = require(path.join(__dirname, 'board'));
Controllers.thread = require(path.join(__dirname, 'thread'));
Controllers.post = require(path.join(__dirname, 'post'));
