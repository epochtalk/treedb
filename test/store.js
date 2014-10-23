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
  test('meta for boards', function(t) {
    tree.first('board', 'created_at', function(err, board) {
      console.log('first board: ' + board.key[1]);

      // grabbing boards in order
      var boards = [];
      tree.nodes('board', {indexedField:'created_at'}).on('data', function(ch) {
        boards.push(ch);
      }).on('end', function() {
        t.ok(boards[0].key[1] === board.key[1],
          'first board retrieved with id: ' + board.key[1]);
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

