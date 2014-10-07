var levelup = require('levelup');
var TreeDB = require('../');
var async = require('async');
var path = require('path');
var helper = require(path.join(__dirname, 'helper'));

var newDb = levelup('./.tdb');
var tree = new TreeDB(newDb);
var db = tree.db;

function noop() {};

function testStore(postsCount) {
  console.log('store test.');
  var posts = [];
  var postStoreRequests = [];
  for (var i = 0; i < postsCount; i++) {
    var post = helper.genPost();
    posts.push(post);
    postStoreRequests.push(function(cb) {
      tree.store(post, function(err, key) {
        return cb(err, key);
      });
    });
  }
  async.parallel(postStoreRequests, function(err) {
    if (!err) {
      console.log('stored ' + postsCount + ' posts');
    }
    return testRetrieve();
  });
};

function testRetrieve() {
  console.log('retrieving...');
  var postsRetrieved = 0;
  tree.nodes('post')
  .on('data', function(post) {
    process.stdout.write(post.key[1] + ' ');
    postsRetrieved += 1;
  })
  .on('end', function() {
    console.log('\n' + postsRetrieved + ' posts retrieved');
    return helper.teardown();
  });
}

testStore(100);

