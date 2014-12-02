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
  test('seed data', function(t) {
    seed(count, function(err) {
      console.log('seed finished');
      t.end();
    });
  });
  test('query boards by pri index', function(t) {
    var lastCreatedAt = 0;
    var boardsStream = tree.nodes({type: 'board', indexedField: 'created_at'});
    var boards = [];
    boardsStream.on('data', function(b) { boards.push(b); });
    boardsStream.on('end', function() {
      boards.forEach(function(ch) {
        var board = ch.value;
        t.ok(
          board.created_at >= lastCreatedAt,
          'created_at should be later than previous entry: ' + board.created_at + ' >= ' + lastCreatedAt
        );
        lastCreatedAt = board.created_at;
        tree.metadata({key: ch.key, field: 'post_count'}, function(err, post_count) {
          t.equal(post_count, count*count, ch.key + ' post_count check: ' + post_count);
        });
        tree.metadata({key: ch.key, field: 'thread_count'}, function(err, thread_count) {
          t.equal(thread_count, count, ch.key + ' thread_count check: ' + thread_count);
        });
      });
      t.equal(boards.length, count, 'board count check');
      t.end();
      tree.teardown();
    });
  });
}

