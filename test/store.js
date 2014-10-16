var test = require('tape');
var levelup = require('levelup');
var async = require('async');
var path = require('path');
var TreeDB = require('../');
var db = new levelup(path.join(__dirname, '.tdb'));
var helper = require(path.join(__dirname, 'helper'));
var tree = TreeDB(db);

tree.addIndex('board', 'created_at', function(err, key) {
  tree.addSecondaryIndex('thread', 'board', 'updated_at', function(err, key) {
    store();
  });
});

function store() {
  test('store', function(t) {
    var count = 3;
    storeForumHierarchy(count, function(err) {
      queryBoardsByIndex(function(err, boards) {
        var lastCreatedAt = 0;
        boards.forEach(function(board) {
          t.ok(board.created_at > lastCreatedAt, 'created_at order check: ' + board.created_at);
          lastCreatedAt = board.created_at;
        });
        t.end();
        helper.teardown();
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

// count is number of boards/threads/posts
function storeForumHierarchy(count, cb) {
  var boards = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    (function() {
      var board = helper.genBoard();
      boards.push(board);
    })();
  }
  boards.forEach(function(board) {
    storeRequests.push(function(cb) {
      tree.store(board, function(err, ch) {
        storeThreads(ch.key, count, cb);
      });
    });
  });
  async.parallel(storeRequests, cb);
};

function storeThreads(boardKey, count, cb) {
  var threads = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    var thread = helper.genThread();
    threads.push(thread);
    storeRequests.push(function(cb) {
      tree.store(thread, boardKey, function(err, ch) {
        storePosts(ch.key, count, cb);
      });
    });
  }
  async.parallel(storeRequests, cb);
};

function storePosts(threadKey, count, cb) {
  var posts = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    var post = helper.genPost();
    posts.push(post);
    storeRequests.push(function(cb) {
      tree.store(post, threadKey, function(err, ch) {
        return cb(err, post);
      });
    });
  }
  async.parallel(storeRequests, cb);
};

