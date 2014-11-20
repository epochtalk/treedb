var test = require('tape');
var levelup = require('levelup');
var async = require('async');
var path = require('path');
var rimraf = require('rimraf');
var gen = require(path.join(__dirname, 'gen'));
var tree = require(path.join(__dirname, 'test-treedb'));
var seed = require(path.join(__dirname, 'seed'));
var indexes = require(path.join(__dirname, 'sample_indexes'));

tree.addIndexes({indexes: indexes, callback: start});

var count = 3;
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
        t.ok(board.created_at >= lastCreatedAt, 'created_at order check: '
          + board.created_at);
        lastCreatedAt = board.created_at;
        // Test metatada
        tree.metadata({key: ch.key, field: 'post_count', callback: function(err, post_count) {
          t.equal(post_count, count*count, ch.key + ' post_count check: ' + post_count);
        }});
        tree.metadata({key: ch.key, field: 'thread_count', callback: function(err, thread_count) {
          t.equal(thread_count, count, ch.key + ' thread_count check: ' + thread_count);
        }});
      });
      t.equal(boards.length, count, 'board count check');
      t.end();
    });
  });
  test('query threads by sec index', function(t) {
    queryBoardsByIndex(function(err, boards) {
      boards.forEach(function(board) {
        queryThreadsBySecIndex(board.key, function(err, threads) {
          t.ok(board, 'board: ' + board.key[1]
            + ' -- following sorted by updated_at');
          var lastUpdatedAt = 0;
          threads.forEach(function(ch) {
            var thread = ch.value;
            t.ok(thread.updated_at >= lastUpdatedAt, 'updated_at order check: '
              + thread.updated_at);
            lastUpdatedAt = thread.updated_at;
            // Test metatada
            tree.metadata({key: ch.key, field: 'post_count', callback: function(err, post_count) {
              t.equal(post_count, count, ch.key + ' post_count check: ' + post_count);
            }});
          });
        });
      });
      t.end();
      teardown();
    });
  });
}

function queryThreadsBySecIndex(boardKey, cb) {
  var threadsStream = tree.children({parentKey: boardKey, type: 'thread', indexedField: 'updated_at'});
  var threads = [];
  threadsStream.on('data', function(ch) {
    threads.push(ch);
  })
  threadsStream.on('end', function() {
    cb(null, threads);
  });
};

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

function teardown() {
  var dbPath = path.join('/', 'tmp', '.treedb');
  rimraf(dbPath, function(error){
    console.log('teardown: removed ' + dbPath);
  });
}

