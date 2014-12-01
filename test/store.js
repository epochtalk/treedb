var test = require('tape');
var levelup = require('levelup');
var async = require('async');
var path = require('path');
var gen = require(path.join(__dirname, 'gen'));
var tree = require(path.join(__dirname, 'test-treedb'));
var seed = require(path.join(__dirname, 'seed'));
var indexes = require(path.join(__dirname, 'sample_indexes'));

tree.addIndexes(indexes, start);

var count = 5;
function start() {
  test('store', function(t) {
    seed(count, function(err) {
      setTimeout(t.end, 1000);
    });
  });
  test('query boards by pri index', function(t) {
    queryBoardsByIndex(function(err, boards) {
      var lastCreatedAt = 0;
      boards.forEach(function(ch) {
        var board = ch.value;
        t.ok(board.created_at >= lastCreatedAt, 'created_at should be later than previous entry: '
          + board.created_at + ' >= ' + lastCreatedAt);
        lastCreatedAt = board.created_at;

      });
      // t.equal(boards.length, count, 'board count check');
      t.end();
      tree.teardown();
    });
  });
}

function queryBoardsByIndex(cb) {
  var boardsStream = tree.nodes({type: 'board', indexedField: 'created_at'});
  var boards = [];
  boardsStream.on('data', function(ch) {
    boards.push(ch);
  })
  boardsStream.on('end', function() {
    cb(null, boards);
  });
};
