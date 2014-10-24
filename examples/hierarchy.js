var path = require('path');
var levelup = require('levelup');
var TreeDB = require(path.join(__dirname, '..'));
var async = require('async');
var helper = require(path.join(__dirname, 'helper'));

var newDb = levelup(path.join(__dirname, '.tdb'));
var tree = new TreeDB(newDb);
var db = tree.db;
tree.addIndex('board', 'created_at');

function noop() {};

function testStoreHierarchy(count) {
  var boards = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    var board = helper.genBoard();
    boards.push(board);
    storeRequests.push(function(cb) {
      tree.store(board, function(err, boardKey) {
        storeThreads(boardKey, count, cb);
      });
    });
  }
  async.parallel(storeRequests, function(err) {
    if (!err) {
      console.log('stored ' + count + ' boards with ' + count + ' threads each');
    }
    return retrieveBoards();
  });
};

function storeThreads(boardKey, count, cb) {
  var threads = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    var thread = helper.genThread();
    threads.push(thread);
    storeRequests.push(function(cb) {
      tree.store(thread, boardKey, function(err, threadKey) {
        return cb(err, thread);
      });
    });
  }
  async.parallel(storeRequests, function(err) {
    if (!err) {
      console.log('board-' + boardKey[1] + ' added ' + count + ' threads');
    }
    // return testRetrieve();
    return cb(err);
  });

};

function retrieveBoards() {
  console.log('retrieving boards...');
  var boardKeys = [];
  tree.nodes('board')
  .on('data', function(board) {
    process.stdout.write(board.key[1] + ' ');
    boardKeys.push(board.key);
  })
  .on('end', function() {
    console.log('\n' + boardKeys.length + ' boards retrieved');
    retrieveThreads(boardKeys);
  });
}

function retrieveThreads(boardKeys) {
  console.log('retrieving threads...');
  var retrieveThreadsRequests = [];
  boardKeys.forEach(function(boardKey) {
    retrieveThreadsRequests.push(function(cb) {
      tree.children(boardKey)
      .on('data', function(chunk) {
        // console.log(chunk.key);
      })
      .on('end', function() {
        return cb();
      });
    });
  });
  async.series(retrieveThreadsRequests, function(err) {
    console.log('done');
    retrieveBoardIndexes();
  });
}

function retrieveBoardIndexes() {
  console.log('trying indexes');
  tree.nodes('board', { indexedField: 'created_at' })
  .on('data', function(index) {
    console.log('index');
    console.log(index);
  })
  .on('end', function() {
    helper.teardown();
  });
}

testStoreHierarchy(10);

