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
    store();
  });
});

function store() {
  test('store', function(t) {
    var count = 3;
    seed(count, function(err) {
      queryBoardsByIndex(function(err, boards) {
        var lastCreatedAt = 0;
        boards.forEach(function(board) {
          t.ok(board.created_at > lastCreatedAt, 'created_at order check: ' + board.created_at);
          lastCreatedAt = board.created_at;
        });
        t.end();
        teardown();
      });
    });
  });
}

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

