var path = require('path');
var db = require('levelup')(path.join('/', 'tmp', 'treedb'));
var tree = require(path.join(__dirname, '..'))(db);
var storeOptions = {
  object: {name: 'Foo Bar', slogan: 'hello world'},
  type: 'person',
  callback: function(err, ch) {
    console.log(ch);
  }
};
tree.store(storeOptions);
