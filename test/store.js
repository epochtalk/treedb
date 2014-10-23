var test = require('tape');
var levelup = require('levelup');
var async = require('async');
var path = require('path');
var rimraf = require('rimraf');
var gen = require(path.join(__dirname, 'gen'));
var tree = require(path.join(__dirname, 'test-treedb'));
var seed = require(path.join(__dirname, 'seed'));

tree.addIndex('board', 'created_at', function(err, key) {
  tree.addSecondaryIndex('thread', 'board', 'updated_at', function(err, key) {
    start();
  });
});

var count = 3;
function start() {
  test('store', function(t) {
    seed(count, function(err) {
      t.end();
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
      });
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
          });
        });
      });
      t.end();
    });
  });
  test('metadata: first for boards', function(t) {
    tree.metadata('first', 'board', 'created_at', function(err, board) {
      // grabbing boards in order
      var boards = [];
      tree.nodes('board', {indexedField:'created_at'}).on('data', function(ch) {
        boards.push(ch);
      }).on('end', function() {
        t.ok(boards[0].key[1] === board.key[1],
          'first board retrieved with id: ' + board.key[1]);
        t.end();
      });
    });
  });
  test('metadata: last for boards', function(t) {
    tree.metadata('last', 'board', 'created_at', function(err, board) {
      // grabbing boards in order
      var boards = [];
      tree.nodes('board', {indexedField:'created_at'}).on('data', function(ch) {
        boards.push(ch);
      }).on('end', function() {
        t.ok(boards[boards.length - 1].key[1] === board.key[1],
          'last board retrieved with id: ' + board.key[1]);
        t.end();
      });
    });
  });

  test('metadata: count for boards', function(t) {
    tree.metadata('count', 'board', 'created_at', function(err, count) {
      // grabbing boards in order
      var boards = [];
      tree.nodes('board', {indexedField:'created_at'}).on('data', function(ch) {
        boards.push(ch);
      }).on('end', function() {
        t.ok(boards.length === count,
          'boards total: ' + count);
        t.end();
        teardown();
      });
    });
  });
}

function queryThreadsBySecIndex(boardKey, cb) {
  var threadsStream = tree.children(boardKey, 'thread', {indexedField: 'updated_at'});
  var threads = [];
  threadsStream.on('data', function(ch) {
    threads.push(ch);
  })
  threadsStream.on('end', function() {
    cb(null, threads);
  });
};

function queryBoardsByIndex(cb) {
  var boardsStream = tree.nodes('board', {indexedField: 'created_at'});
  var boards = [];
  boardsStream.on('data', function(ch) {
    boards.push(ch);
  })
  boardsStream.on('end', function() {
    cb(null, boards);
  });
};

function teardown() {
  var dbPath = path.join('/tmp', '.treedb');
  rimraf(dbPath, function(error){
    console.log('teardown: removed ' + dbPath);
  });
}

