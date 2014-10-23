module.exports = seedForum;
var async = require('async');
var path = require('path');
var gen = require(path.join(__dirname, 'gen'));
var tree = require(path.join(__dirname, 'test-treedb'));

// count is number of boards/threads/posts
function seedForum(count, cb) {
  var storeRequests = [];
  var boards = genFake('board', count);

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
  var threads = genFake('thread', count);
  var storeRequests = [];
  threads.forEach(function(thread) {
    storeRequests.push(function(cb) {
      tree.store(thread, boardKey, function(err, ch) {
        storePosts(ch.key, count, cb);
      });
    });
  });
  async.parallel(storeRequests, cb);
};

function storePosts(threadKey, count, cb) {
  var posts = genFake('post', count);
  var storeRequests = [];
  posts.forEach(function(post) {
    storeRequests.push(function(cb) {
      tree.store(post, threadKey, function(err, ch) {
        cb(err, post);
      });
    });
  });
  async.parallel(storeRequests, cb);
};

function genFake(type, count) {
  var objs = [];
  for (var i = 0; i < count; i++) {
    (function() {
      var obj = gen[type]();
      objs.push(obj);
    })();
  }
  return objs;
}

