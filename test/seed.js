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
      var storeOptions = {
        object: board,
        type: 'board',
        callback: function(options) {
          storeThreads(options.key, count, cb);
        }
      };
      tree.store(storeOptions);
    });
  });
  async.parallel(storeRequests, cb);
};

function storeThreads(boardKey, count, cb) {
  var threads = genFake('thread', count);
  var storeRequests = [];
  threads.forEach(function(thread) {
    storeRequests.push(function(cb) {
      var storeOptions = {
        object: thread,
        type: 'thread',
        parentKey: boardKey,
        callback: function(options) {
          storePosts(options.key, count, cb);
        }
      };
      tree.store(storeOptions);
    });
  });
  async.parallel(storeRequests, cb);
};

function storePosts(threadKey, count, cb) {
  var posts = genFake('post', count);
  var storeRequests = [];
  posts.forEach(function(post) {
    storeRequests.push(function(cb) {
      var storeOptions = {
        object: post,
        type: 'post',
        parentKey: threadKey,
        callback: function(options) {
          cb(options.err, post);
        }
      };
      tree.store(storeOptions);
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

