var path = require('path');
var db = require('levelup')(path.join('/', 'tmp', 'treedb'));
var tree = require(path.join(__dirname, '..'))(db);
var storeOptions = {
  object: {name: 'Foo Bar', slogan: 'hello world'},
  type: 'person',
  callback: function(options) {
    console.log(options.key, options.value);
  }
};
tree.store(storeOptions);
