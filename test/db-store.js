var levelup = require('levelup');
var TreeDB = require('../');
var rimraf = require('rimraf');
var faker = require('faker');
var async = require('async');

var newDb = levelup('./.tdb');
var tree = new TreeDB(newDb);
var db = tree.db;

function noop() {};
function genPost() {
  var post = {
    type: 'post',
    title: faker.hacker.adjective() + ' ' + faker.hacker.noun(),
    body: faker.lorem.paragraph(),
    created_at: Date.now()
  };
  return post;
};

function testStore(postsCount) {
  console.log('store test.');
  var posts = [];
  var postStoreRequests = [];
  for (var i = 0; i < postsCount; i++) {
    var post = genPost();
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
    console.log(post.key[0] + '-' + post.key[1]);
    postsRetrieved += 1;
  })
  .on('end', function() {
    console.log(postsRetrieved + ' posts retrieved');
    return teardown();
  });
}

function teardown() {
  rimraf('./.tdb', function(error){
    console.log('teardown: removed ./.tdb.');
  });
};

testStore(100);

