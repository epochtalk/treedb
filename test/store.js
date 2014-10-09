var test = require('tape');
var levelup = require('levelup');
var async = require('async');
var path = require('path');
var TreeDB = require('../');
var db = new levelup(path.join(__dirname, '.tdb'));
var helper = require(path.join(__dirname, 'helper'));
var tree = new TreeDB(db);

tree.addIndex('board', 'created_at', function(err, key) {
  store();
});

function store() {
  test('store', function(t) {
    var count = 3;
    storeBoards(count, function(err) {
      if (err) throw err;
      console.log('stored ' + count + ' boards with ' + count + ' threads each');
      var boardsStream = tree.nodes('board', {indexedField: 'created_at'});
      var lastCreatedAt = 0;
      boardsStream.on('data', function(ch) {
        t.ok(ch.created_at > lastCreatedAt);
        lastCreatedAt = ch.created_at;
      })
      boardsStream.on('end', function() {
        t.end();
      });
    });
  });
}

function storeBoards(count, cb) {
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
  async.parallel(storeRequests, cb);
};

function storeThreads(boardKey, count, cb) {
  var threads = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    var thread = helper.genThread();
    threads.push(thread);
    storeRequests.push(function(cb) {
      tree.store(thread, boardKey, function(err, threadKey) {
        storePosts(threadKey, count, cb);
      });
    });
  }
  async.parallel(storeRequests, function(err) {
    if (!err) {
      console.log('board-' + boardKey[1] + ' added ' + count + ' threads');
    }
    return cb(err);
  });
};

function storePosts(threadKey, count, cb) {
  var posts = [];
  var storeRequests = [];
  for (var i = 0; i < count; i++) {
    var post = helper.genPost();
    posts.push(post);
    storeRequests.push(function(cb) {
      tree.store(post, threadKey, function(err, postKey) {
        return cb(err, post);
      });
    });
  }
  async.parallel(storeRequests, function(err) {
    if (!err) {
      console.log('thread-' + threadKey[1] + ' added ' + count + ' posts');
    }
    return cb(err);
  });
};
